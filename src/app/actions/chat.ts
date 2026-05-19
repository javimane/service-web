import { supabase } from "@/services/supabaseClient";
import { getProfileAction } from "./profile";

export const getProfileByUserIdAction = async ({ id }: { id: string }) => {
  const res = await getProfileAction({ id });
  if (res?.validationErrors || res?.serverError) {
    throw new Error(res?.serverError || "Error fetching profile");
  }
  return { data: res?.data };
};

export const getMessagesAction = async ({ userId, receiverId }: { userId: string, receiverId: string }) => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${userId})`)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return { data };
};

export const sendMessageAction = async ({ senderId, receiverId, content, fileUrl }: { senderId: string, receiverId: string, content: string, fileUrl?: string }) => {
  const messageToSend = {
    sender_id: senderId,
    receiver_id: receiverId,
    content: content,
    is_read: false,
    file_url: fileUrl || null,
  };

  const { data, error } = await supabase
    .from("messages")
    .insert([messageToSend])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return { data };
};

export const markMessagesAsReadAction = async ({ userId, senderId }: { userId: string, senderId: string }) => {
  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("receiver_id", userId)
    .eq("sender_id", senderId)
    .eq("is_read", false);

  if (error) {
    throw new Error(error.message);
  }
  return { success: true };
};

export const getUserConversationsAction = async ({ userId }: { userId: string }) => {
  // Fetch all messages involving the user to determine active conversations
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const messages = data ?? [];
  
  // Group by other user
  const conversationsMap = new Map();
  
  for (const msg of messages) {
    const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    if (!conversationsMap.has(otherId)) {
      conversationsMap.set(otherId, {
        id: otherId,
        user_id: userId,
        receiver_id: otherId,
        message: msg.content,
        updated_at: msg.created_at,
        unreadCount: msg.receiver_id === userId && !msg.is_read ? 1 : 0
      });
    } else {
       if (msg.receiver_id === userId && !msg.is_read) {
          conversationsMap.get(otherId).unreadCount += 1;
       }
    }
  }

  return { data: Array.from(conversationsMap.values()) };
};
