import { useState, useRef, useEffect } from "react";
import { Search, Paperclip, Mic, Smile, Send, ImageIcon } from "lucide-react";
import "./MessagesPage.css";

const conversations = [
  {
    id: 1,
    name: "Julian Vargas",
    role: "Architect & Designer",
    avatar: "JV",
    lastMessage: "The project blueprints are re...",
    time: "2H AGO",
    online: true,
    messages: [
      {
        id: 1,
        sender: "them",
        text: "Hello! I've just finalized the structural concepts for the Obsidian Tower project. Would you like to review the initial 3D renders now?",
        time: "10:42 AM",
        date: "TUESDAY, 24 OCT",
      },
      {
        id: 2,
        sender: "me",
        text: "That sounds perfect, Julian. Architectural precision is exactly what we're aiming for. Please go ahead and share them.",
        time: "10:42 AM",
        status: "READ",
      },
      {
        id: 3,
        sender: "them",
        text: "Here's a sneak peek at the main lobby entrance. Note how the obsidian finish interacts with the lavender light arrays.",
        time: "10:45 AM",
        image: {
          title: "Project Overview",
          subtitle: "Lobby entrance",
        },
      },
    ],
  },
  {
    id: 2,
    name: "Elena Rossi",
    role: "Interior Designer",
    avatar: "ER",
    lastMessage: "I've sent the updated color p...",
    time: "1H AGO",
    online: false,
    messages: [
      {
        id: 1,
        sender: "them",
        text: "I've sent the updated color palette for the penthouse suite. Let me know your thoughts!",
        time: "11:30 AM",
        date: "TUESDAY, 24 OCT",
      },
    ],
  },
  {
    id: 3,
    name: "Marcus Chen",
    role: "Project Manager",
    avatar: "MC",
    lastMessage: "Can we schedule a call for th...",
    time: "YESTERDAY",
    online: false,
    messages: [
      {
        id: 1,
        sender: "them",
        text: "Can we schedule a call for this Thursday? We need to review the project timeline.",
        time: "3:15 PM",
        date: "MONDAY, 23 OCT",
      },
    ],
  },
  {
    id: 4,
    name: "Sarah Jenkins",
    role: "Legal Advisor",
    avatar: "SJ",
    lastMessage: "The contract has been signe...",
    time: "2D AGO",
    online: false,
    messages: [
      {
        id: 1,
        sender: "them",
        text: "The contract has been signed and filed. All documentation is in order for the next phase.",
        time: "9:00 AM",
        date: "SUNDAY, 22 OCT",
      },
    ],
  },
];

export default function MessagesPage() {
  const [activeConversation, setActiveConversation] = useState(
    conversations[0],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    setNewMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="messages-page">
      {/* Sidebar */}
      <aside className="messages-sidebar">
        <h1 className="messages-sidebar__title">Messages</h1>

        <div className="messages-sidebar__search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="messages-sidebar__list">
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              className={`conversation-item ${activeConversation.id === conv.id ? "active" : ""}`}
              onClick={() => setActiveConversation(conv)}
            >
              <div className="conversation-item__avatar">
                {conv.avatar}
                {conv.online && <span className="online-dot" />}
              </div>
              <div className="conversation-item__content">
                <div className="conversation-item__header">
                  <span className="conversation-item__name">{conv.name}</span>
                  <span className="conversation-item__time">{conv.time}</span>
                </div>
                <p className="conversation-item__preview">{conv.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <main className="chat-area">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header__avatar">
            {activeConversation.avatar}
            {activeConversation.online && <span className="online-dot" />}
          </div>
          <div className="chat-header__info">
            <span className="chat-header__name">{activeConversation.name}</span>
            <span className="chat-header__status">
              {activeConversation.online ? "ACTIVE NOW" : "OFFLINE"} •{" "}
              {activeConversation.role.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {activeConversation.messages.map((msg) => (
            <div key={msg.id}>
              {msg.date && (
                <div className="chat-date-separator">
                  <span>{msg.date}</span>
                </div>
              )}
              <div
                className={`chat-bubble-wrapper ${msg.sender === "me" ? "sent" : "received"}`}
              >
                <div
                  className={`chat-bubble ${msg.sender === "me" ? "chat-bubble--sent" : "chat-bubble--received"}`}
                >
                  {msg.image && (
                    <div className="chat-bubble__image">
                      <ImageIcon size={32} />
                      <div className="chat-bubble__image-overlay">
                        <span className="chat-bubble__image-title">
                          {msg.image.title}
                        </span>
                        <span className="chat-bubble__image-subtitle">
                          {msg.image.subtitle}
                        </span>
                      </div>
                    </div>
                  )}
                  <p>{msg.text}</p>
                </div>
                <span className="chat-bubble__time">
                  {msg.time}
                  {msg.status && ` • ${msg.status}`}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="chat-input-bar">
          <button className="chat-input-bar__icon" aria-label="Attach file">
            <Paperclip size={20} />
          </button>
          <button className="chat-input-bar__icon" aria-label="Voice message">
            <Mic size={20} />
          </button>
          <input
            type="text"
            className="chat-input-bar__input"
            placeholder="Write your message here..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="chat-input-bar__icon" aria-label="Emoji">
            <Smile size={20} />
          </button>
          <button
            className="chat-input-bar__send"
            onClick={handleSend}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}
