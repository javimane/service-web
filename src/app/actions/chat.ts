import { supabase } from "@/services/supabaseClient";
import { getProfileAction } from "./profile";

export const getProfileByUserIdAction = async ({ id }: { id: string }) => {
  if (!id || id === "undefined" || id === "null") return { data: null };
  
  try {
    const res = await getProfileAction({ id });
    if (res?.validationErrors || res?.serverError) {
      console.error("Error fetching profile from getProfileAction:", res.serverError);
      return { data: null, error: res.serverError };
    }
    return { data: res?.data };
  } catch (error) {
    console.error("Error in getProfileByUserIdAction:", error);
    return { data: null, error };
  }
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

export const getChatClientsAction = async ({ userId }: { userId: string }) => {
  // Fetch messages to get unique user IDs who have chatted with the user
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("sender_id, receiver_id")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

  if (messagesError) {
    throw new Error(messagesError.message);
  }

  const otherUserIds = new Set<string>();
  messages?.forEach(msg => {
    const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    otherUserIds.add(otherId);
  });

  if (otherUserIds.size === 0) return { data: [] };

  // Fetch the profiles of these users
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", Array.from(otherUserIds));

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  return { data: profiles };
};
