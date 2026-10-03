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
    .is("order_id", null)
    .order("created_at", { ascending: true });

  if (error) {
    // If order_id column does not exist yet in DB, fallback to query without it
    if (error.message?.includes("order_id") || error.code === "42703" || error.code === "PGRST204") {
      const fallback = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${userId})`)
        .order("created_at", { ascending: true });
      if (fallback.error) throw new Error(fallback.error.message);
      return { data: fallback.data };
    }
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

export const deleteChatAction = async ({ userId, otherUserId }: { userId: string, otherUserId: string }) => {
  const { error } = await supabase
    .from("messages")
    .delete()
    .in("sender_id", [userId, otherUserId])
    .in("receiver_id", [userId, otherUserId]);

  if (error) {
    throw new Error(error.message);
  }
  return { success: true };
};

export const getUserConversationsAction = async ({ userId }: { userId: string }) => {
  // Fetch all messages involving the user to determine active general conversations (excluding order chats)
  let query = supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .is("order_id", null)
    .order("created_at", { ascending: false });

  const { data, error } = await query;

  let messages = data ?? [];

  if (error) {
    if (error.message?.includes("order_id") || error.code === "42703" || error.code === "PGRST204") {
      const fallback = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (fallback.error) throw new Error(fallback.error.message);
      messages = fallback.data ?? [];
    } else {
      throw new Error(error.message);
    }
  }
  
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
  try {
    const current = String(userId);
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("sender_id, receiver_id")
      .or(`sender_id.eq.${current},receiver_id.eq.${current}`);

    if (messagesError) {
      console.error("Error fetching messages in getChatClientsAction:", messagesError);
      throw new Error(messagesError.message);
    }

    const otherUserIds = new Set<string>();
    messages?.forEach(msg => {
      const sender = msg.sender_id ? String(msg.sender_id) : null;
      const receiver = msg.receiver_id ? String(msg.receiver_id) : null;
      if (sender === current && receiver && receiver !== current) {
        otherUserIds.add(receiver);
      } else if (receiver === current && sender && sender !== current) {
        otherUserIds.add(sender);
      }
    });

    if (otherUserIds.size === 0) return { data: [] };

    // Fetch the profiles of these users
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", Array.from(otherUserIds));

    if (profilesError) {
      console.error("Error fetching profiles in getChatClientsAction:", profilesError);
      throw new Error(profilesError.message);
    }

    return { data: profiles };
  } catch (error) {
    console.error("Exception in getChatClientsAction:", error);
    throw error;
  }
};

export const getOrderMessagesAction = async ({
  orderId,
}: {
  orderId: string;
}) => {
  if (!orderId) return { data: [] };

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Could not query order messages (column order_id may not exist yet):", error.message);
      return { data: [], error: error.message };
    }

    return { data: data || [] };
  } catch (err: any) {
    console.error("Error in getOrderMessagesAction:", err);
    return { data: [], error: err?.message };
  }
};

export const sendOrderMessageAction = async ({
  senderId,
  receiverId,
  orderId,
  content,
  fileUrl,
}: {
  senderId: string;
  receiverId: string;
  orderId: string;
  content: string;
  fileUrl?: string;
}) => {
  const messageToSend: any = {
    sender_id: senderId,
    receiver_id: receiverId,
    order_id: orderId,
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
    console.error("Error sending order message:", error.message);
    if (error.message?.includes("order_id") || error.code === "42703" || error.code === "PGRST204") {
      throw new Error(
        "Falta agregar la columna 'order_id' en la tabla 'messages' de la base de datos para habilitar el chat por venta."
      );
    }
    throw new Error(error.message);
  }

  return { data };
};

export const markOrderMessagesAsReadAction = async ({
  orderId,
  userId,
}: {
  orderId: string;
  userId: string;
}) => {
  try {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("order_id", orderId)
      .eq("receiver_id", userId)
      .eq("is_read", false);

    if (error) {
      console.warn("Could not mark order messages as read:", error.message);
    }
    return { success: !error };
  } catch (e) {
    return { success: false };
  }
};
