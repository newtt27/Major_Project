"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/app/redux";
import {
  useGetMyChatroomsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useGetChatroomMembersQuery,
  useCreateChatroomMutation,
  useMarkChatroomAsReadMutation,
  useGetUsersQuery,
  useGetMyDepartmentUsersQuery,
  useKickMemberFromChatroomMutation,
  useAddMembersToChatroomMutation,
  useDownloadAttachmentQuery,
} from "@/state/api";
import { io, Socket } from "socket.io-client";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { 
  Search, Plus, Paperclip, Send, MoreVertical, X, Check, UserX, UserPlus,
  FileText, Image, Video, File, Upload, Loader2, AlertCircle 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Progress,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/progress"; 
import DashboardWrapper from "../dashboardWrapper";
import FileAttachment from "@/components/chat/FileAttachment";

interface TypingUser {
  userId: number;
  name: string;
}
interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  position?: string;
}


// Interface cho file upload
interface UploadFile {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, permissions, userId, roles = [] } = useAppSelector((state) => state.auth);

  // === PHÂN QUYỀN ===
  const normalizedRoles = roles.map(r => r.toLowerCase());
  const isAdmin = normalizedRoles.includes("admin");
  const isManager = normalizedRoles.includes("manager");

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated || userId === null) {
    return <div className="flex items-center justify-center h-screen">Đang tải...</div>;
  }

  // === STATE ===
  const [socket, setSocket] = useState<Socket | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [selectedChatroom, setSelectedChatroom] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [openCreate, setOpenCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState<"Private" | "Group">("Private");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [searchUser, setSearchUser] = useState("");
  const [openMembers, setOpenMembers] = useState(false);
  const [openAddMembers, setOpenAddMembers] = useState(false);
  const [addSelectedUsers, setAddSelectedUsers] = useState<number[]>([]);
  const [addSearchUser, setAddSearchUser] = useState("");
  const [kickTarget, setKickTarget] = useState<{ userId: number; name: string } | null>(null);

  // === API ===
  const {
    data: chatroomsResponse,
    isLoading: loadingChatrooms,
    refetch: refetchChatrooms,
  } = useGetMyChatroomsQuery(undefined, { skip: !isAuthenticated });
  const chatrooms = chatroomsResponse?.data ?? [];

  const {
    data: messagesResponse = { data: [] },
    isFetching: loadingMessages,
    refetch: refetchMessages,
  } = useGetMessagesQuery(
    { chatroomId: selectedChatroom!, limit: 50, offset: 0 },
    { skip: !selectedChatroom }
  );
  const messages = messagesResponse.data || [];

  const { data: membersResponse, refetch: refetchMembers } = useGetChatroomMembersQuery(selectedChatroom!, { skip: !selectedChatroom });
  const members = membersResponse?.data ?? [];

  const currentRoom = chatrooms.find(r => r.chatroom_id === selectedChatroom);
  const myRoleInRoom = currentRoom?.user_role;
  const canManage = isAdmin || myRoleInRoom === 'Admin';

  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();
  const [createChatroom, { isLoading: creatingRoom }] = useCreateChatroomMutation();
  const [markChatroomAsRead] = useMarkChatroomAsReadMutation();
  const [kickMember] = useKickMemberFromChatroomMutation();
  const [addMembers, { isLoading: addingMembers }] = useAddMembersToChatroomMutation();

  const canCreateRoom = permissions.includes("chat:create-room");

  // === FILE VALIDATION ===
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
    'application/pdf',
    'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type === 'application/pdf') return FileText;
    return File;
  };

  const getFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // === FILE UPLOAD LOGIC ===
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File quá lớn. Kích thước tối đa: ${getFileSize(MAX_FILE_SIZE)}`;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Loại file không được hỗ trợ. Chỉ chấp nhận: ${ALLOWED_TYPES.map(t => t.split('/')[1]).slice(0, 3).join(', ')}...`;
    }
    return null;
  };

  const handleFileSelect = (selectedFiles: File[]) => {
  const newFiles: UploadFile[] = selectedFiles.map(file => {
    const error = validateFile(file); 
    return {
      file,
      id: Date.now() + Math.random().toString(36),
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: error ? 'error' : 'pending',
      error: error ?? undefined, 
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    };
  });

  setFiles(prev => [...prev, ...newFiles]);
};

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(Array.from(e.target.files));
      e.target.value = ''; 
    }
  };

  const removeFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(Array.from(e.dataTransfer.files));
    }
  }, [handleFileSelect]);


  // === SOCKET SETUP ===
  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const newSocket = io("http://localhost:5000", {
      auth: { token },
      transports: ["websocket"],
    });

    newSocket.on("connect", () => console.log("[Socket] Connected:", newSocket.id));
    newSocket.on("connect_error", (err) => console.error("[Socket] Error:", err.message));

    setSocket(newSocket);

    return () => {
      try { newSocket.close(); } catch (e) {}
      setSocket(null);
    };
  }, [isAuthenticated]);

  // === JOIN/LEAVE CHATROOM ===
  useEffect(() => {
    if (!socket || !selectedChatroom) return;

    socket.emit("join_chatroom", selectedChatroom);

    (async () => {
      try {
        await markChatroomAsRead(selectedChatroom).unwrap?.();
      } catch (err) {}
      socket.emit("read_messages", { chatroomId: selectedChatroom });
      refetchChatrooms();
      refetchMessages();
    })();

    return () => {
      socket.emit("leave_chatroom", selectedChatroom);
    };
  }, [socket, selectedChatroom]);

  // === TYPING INDICATOR ===
  const typingTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (!socket || !selectedChatroom) return;
    if (message.trim()) {
      socket.emit("typing", { chatroomId: selectedChatroom, isTyping: true, name: "" });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = window.setTimeout(() => {
        socket.emit("typing", { chatroomId: selectedChatroom, isTyping: false, name: "" });
      }, 1500);
    } else {
      socket.emit("typing", { chatroomId: selectedChatroom, isTyping: false, name: "" });
    }
  }, [message, socket, selectedChatroom]);

  useEffect(() => {
    if (!socket) return;
    const handleTyping = (data: { userId: number; name: string; isTyping: boolean; chatroomId?: number }) => {
      if (data.chatroomId && data.chatroomId !== selectedChatroom) return;
      setTypingUsers((prev) => {
        if (data.isTyping) {
          return prev.some(u => u.userId === data.userId) ? prev : [...prev, { userId: data.userId, name: data.name }];
        }
        return prev.filter(u => u.userId !== data.userId);
      });
    };
    socket.on("typing", handleTyping);
    return () => {
      socket.off("typing", handleTyping);
    };
  }, [socket, selectedChatroom]);

  // === NHẬN TIN NHẮN MỚI ===
  useEffect(() => {
    if (!socket) return;
    const handleMessage = (data: any) => {
      const crId = data?.chatroom_id ?? data?.chatroomId;
      if (!crId) { refetchChatrooms(); return; }
      if (selectedChatroom === crId) refetchMessages();
      else refetchChatrooms();
    };
    socket.on("message", handleMessage);
    socket.on("new_message", handleMessage);
    return () => {
      socket.off("message", handleMessage);
      socket.off("new_message", handleMessage);
    };
  }, [socket, selectedChatroom, refetchMessages, refetchChatrooms]);

  // === NHẬN ĐÃ ĐỌC ===
  useEffect(() => {
    if (!socket) return;
    const handleRead = (data: { chatroomId: number }) => {
      if (data.chatroomId === selectedChatroom) refetchMessages();
      refetchChatrooms();
    };
    socket.on("message_read", handleRead);
    socket.on("messages_read", handleRead);
    return () => {
      socket.off("message_read", handleRead);
      socket.off("messages_read", handleRead);
    };
  }, [socket, selectedChatroom, refetchMessages, refetchChatrooms]);

  // === AUTO SCROLL ===
useEffect(() => {
  if (!scrollRef.current || !selectedChatroom) return;

  const container = scrollRef.current;
  const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

  // Chỉ tự động scroll nếu đang ở gần cuối (tránh nhảy khi người dùng kéo lên xem cũ)
  if (isNearBottom || messages.length <= 1) {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth"
    });
  }
}, [messages, selectedChatroom, typingUsers]);

  // === HÀM GỬI TIN (CẬP NHẬT VỚI FILE) ===
 const handleSendMessage = async () => {
  if (!selectedChatroom) {
    alert("Vui lòng chọn phòng chat");
    return;
  }

  if (!message.trim() && files.length === 0) return;

  const validFiles = files.filter(f => ['pending', 'success'].includes(f.status));
  if (validFiles.length === 0 && !message.trim()) return;

  const formData = new FormData();
  formData.append("chatroom_id", selectedChatroom.toString()); // ← Đảm bảo là số

  if (message.trim()) {
    formData.append("message_text", message.trim());
  }

  validFiles.forEach(f => {
    formData.append("files", f.file); // key: "files" → đúng với multer
  });

  try {
    setFiles(prev => prev.map(f =>
      f.status === 'pending' ? { ...f, status: 'uploading', progress: 30 } : f
    ));

    console.log("Gửi FormData:", Object.fromEntries(formData)); // DEBUG

    const res = await sendMessage(formData).unwrap();

    setFiles(prev => prev.map(f =>
      f.status === 'uploading' ? { ...f, status: 'success', progress: 100 } : f
    ));

    // Reset
    setMessage("");
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Refetch
    refetchMessages();
    refetchChatrooms();

  } catch (err: any) {
    console.error("Lỗi gửi tin nhắn:", err);

    setFiles(prev => prev.map(f =>
      f.status === 'uploading' ? { ...f, status: 'error', error: err?.data?.error || "Gửi thất bại" } : f
    ));

    alert(err?.data?.error || "Gửi tin nhắn thất bại. Vui lòng thử lại.");
  }
};


  // === TẠO PHÒNG ===
  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return alert("Vui lòng nhập tên phòng");
    if (selectedUsers.length === 0) return alert("Vui lòng chọn ít nhất 1 thành viên");

    if (newRoomType === "Private" && selectedUsers.length !== 1) {
      return alert("Phòng riêng chỉ được chọn đúng 1 người");
    }

    try {
      await createChatroom({
        chatroom_name: newRoomName.trim(),
        chatroom_type: newRoomType,
        member_ids: selectedUsers,
      }).unwrap();

      setOpenCreate(false);
      setNewRoomName("");
      setNewRoomType("Private");
      setSelectedUsers([]);
      setSearchUser("");
      refetchChatrooms();
      alert("Tạo phòng chat thành công!");
    } catch (error: any) {
      alert(error.data?.message || "Tạo phòng thất bại");
    }
  };

  // === THÊM THÀNH VIÊN ===
  const handleAddMembers = async () => {
    if (addSelectedUsers.length === 0 || !selectedChatroom) return;

    try {
      await addMembers({
        chatroomId: selectedChatroom,
        user_ids: addSelectedUsers,
      }).unwrap();

      setOpenAddMembers(false);
      setAddSelectedUsers([]);
      setAddSearchUser("");
      refetchMembers();
      refetchChatrooms();
      alert("Thêm thành viên thành công!");
    } catch (err: any) {
      alert(err.data?.message || "Thêm thất bại");
    }
  };

  // === KICK MEMBER ===
  const handleKick = async () => {
    if (!kickTarget || !selectedChatroom) return;

    try {
      await kickMember({
        chatroomId: selectedChatroom,
        userId: kickTarget.userId,
      }).unwrap();

      refetchMembers();
      refetchChatrooms();
      setKickTarget(null);
      alert(`${kickTarget.name} đã bị xóa khỏi phòng.`);
    } catch (err: any) {
      alert(err.data?.message || "Không thể xóa thành viên");
    }
  };

  const handleSelectChatroom = useCallback((roomId: number) => {
    setSelectedChatroom(roomId);
  }, []);

  // === USER SELECTION ===
  const {
    data: allUsers = [],
    isLoading: loadingAllUsers,
  } = useGetUsersQuery(undefined, {
    skip: !openCreate && !openAddMembers || !isAdmin,
  });

  const {
    data: deptUsers = [],
    isLoading: loadingDeptUsers,
  } = useGetMyDepartmentUsersQuery(undefined, {
    skip: !openCreate && !openAddMembers || !isManager || isAdmin,
  });

  const allUsersArray: User[] = Array.isArray(allUsers) ? allUsers : allUsers?.data ?? [];
  const deptUsersArray: User[] = Array.isArray(deptUsers) ? deptUsers : deptUsers?.data ?? [];

  const availableUsers: User[] = isAdmin
    ? allUsersArray.filter((u) => u.user_id !== userId)
    : deptUsersArray;

  const loadingUsers = isAdmin ? loadingAllUsers : loadingDeptUsers;

  const availableToAdd: User[] = availableUsers.filter(
    (u) => !members.some(m => m.user_id === u.user_id)
  );

  const filteredToAdd: User[] = availableToAdd.filter((user: User) =>
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(addSearchUser.toLowerCase())
  );

  const filteredUsers: User[] = availableUsers.filter((user: User) =>
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchUser.toLowerCase())
  );

  const toggleUser = (userId: number) => {
    if (newRoomType === "Private") {
      setSelectedUsers([userId]);
    } else {
      setSelectedUsers(prev =>
        prev.includes(userId)
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    }
  };

  const toggleAddUser = (userId: number) => {
    setAddSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const removeSelectedUser = (userId: number) => {
    setSelectedUsers(prev => prev.filter(id => id !== userId));
  };

  const removeAddSelectedUser = (userId: number) => {
    setAddSelectedUsers(prev => prev.filter(id => id !== userId));
  };

  if (loadingChatrooms) {
    return <div className="flex items-center justify-center h-96">Đang tải...</div>;
  }

  return (
    <TooltipProvider>
      <DashboardWrapper>
        <div className="h-full w-full flex bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Sidebar - GIỮ NGUYÊN */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Chat</h2>
              <Button size="sm" onClick={() => setOpenCreate(true)} disabled={!canCreateRoom}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input placeholder="Tìm kiếm..." className="pl-10" />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {chatrooms.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Chưa có cuộc trò chuyện nào</p>
              ) : (
                [...chatrooms]
      .sort((a, b) => {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA; 
      })
      .map((room) => {
        const time = room.updated_at
          ? formatDistanceToNow(new Date(room.updated_at), { addSuffix: true })
          : "";
        const unread = room.unread_count ?? 0;
                  return (
                   <div
            key={room.chatroom_id}
            onClick={() => handleSelectChatroom(room.chatroom_id)}
            className={`
              p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100
              transition-all duration-200 ease-in-out
              ${selectedChatroom === room.chatroom_id ? "bg-blue-50 border-blue-200" : ""}
            `}
          >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${room.chatroom_id}`} />
                            <AvatarFallback>{room.chatroom_name[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {unread > 0 && (
                            <span className="absolute -top-1 -right-1">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-[10px] font-semibold">
                                {unread > 99 ? "99+" : unread}
                              </span>
                              <span className="absolute -inset-0 animate-ping rounded-full bg-red-400 opacity-30" />
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">{room.chatroom_name}</p>
                            <span className="text-xs text-gray-500">{time}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{room.member_count} thành viên</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </ScrollArea>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {selectedChatroom ? (
              <>
                {/* Header - GIỮ NGUYÊN */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChatroom}`} />
                      <AvatarFallback>C</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">
                        {chatrooms.find(r => r.chatroom_id === selectedChatroom)?.chatroom_name}
                      </p>
                      <button
                        onClick={() => setOpenMembers(true)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {members.length} thành viên
                      </button>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setOpenAddMembers(true)} disabled={!canManage}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Thêm thành viên
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setOpenMembers(true)}>
                        Xem thành viên
                      </DropdownMenuItem>
                      <DropdownMenuItem>Xem file</DropdownMenuItem>
                      <DropdownMenuItem>Cài đặt thông báo</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Xóa cuộc trò chuyện</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Messages Area */}
               {/* Messages Area - THAY ĐỔI TẠI ĐÂY */}
<div 
  ref={scrollRef}
  className="flex-1 overflow-y-auto p-4 space-y-4"
  style={{ scrollBehavior: 'smooth' }} // optional: mượt khi scroll
>
  {loadingMessages ? (
    <p className="text-center text-gray-500">Đang tải tin nhắn...</p>
  ) : messages.length === 0 ? (
    <p className="text-center text-gray-400 py-12">Bắt đầu cuộc trò chuyện...</p>
  ) : (
    [...messages]
      .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
      .map((msg) => {
        const isMe = Number(msg.sender_id) === Number(userId);
        const sender = members.find(m => m.user_id === msg.sender_id);

        return (
          <div key={msg.message_id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-2 max-w-md ${isMe ? "flex-row-reverse" : ""}`}>
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender_id}`} />
                <AvatarFallback>{sender?.first_name?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                {!isMe && sender && (
                  <p className="text-xs text-gray-500 mb-1">
                    {sender.first_name} {sender.last_name}
                  </p>
                )}
                <div className={`rounded-lg px-3 py-2 ${isMe ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                  {msg.message_text && (
                    <p className="break-words whitespace-pre-wrap text-sm">{msg.message_text}</p>
                  )}
                  {msg.attachments?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.attachments.map((att) => (
                        <FileAttachment
                          key={att.attachment_id}
                          attachment={att}
                          chatroomId={selectedChatroom!}
                          isMe={isMe}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className={`flex items-center mt-1 ${isMe ? "justify-end" : ""}`}>
                  <p className={`text-xs ${isMe ? "text-blue-200" : "text-gray-500"}`}>
                    {format(new Date(msg.sent_at), "HH:mm")}
                  </p>
                  {isMe && (
                    <div className="ml-2 flex items-center">
                      {!msg.is_read ? (
                        <Check className="w-4 h-4 text-gray-400 ml-1" />
                      ) : (
                        <div className="flex -space-x-1 ml-1">
                          <Check className="w-3.5 h-3.5 text-blue-500" />
                          <Check className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })
  )}

  {/* Typing indicator */}
  {typingUsers.length > 0 && (
    <div className="flex items-center gap-2 text-sm text-gray-500 italic">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      {typingUsers.map(u => u.name).join(", ")} đang nhập...
    </div>
  )}
</div>

                {/* Input Area - NÂNG CẤP FILE UPLOAD */}
                <div 
                  className={`p-4 border-t border-gray-200 bg-white transition-all ${
                    dragActive ? 'border-2 border-dashed border-blue-400 bg-blue-50' : ''
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {/* File Preview */}
                  {files.length > 0 && (
                    <div className="mb-3 space-y-2 max-h-24 overflow-y-auto">
                      {files.map((file) => (
                        <div key={file.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            {file.preview ? (
                              <img 
                                src={file.preview} 
                                alt={file.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
  {(() => {
    const Icon = getFileIcon(file.type);
    return <Icon className="w-5 h-5 text-gray-500" />;
  })()}
</div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{getFileSize(file.size)}</p>
                          </div>

                          {/* Progress/Error */}
                          {file.status === 'uploading' && (
                            <div className="w-16">
                              <Progress value={file.progress} className="h-2" />
                              <div className="flex items-center gap-1 mt-1">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span className="text-xs text-gray-500">{file.progress}%</span>
                              </div>
                            </div>
                          )}

                          {file.status === 'error' && (
                            <div className="flex items-center gap-1 text-red-500">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-xs">{file.error}</span>
                            </div>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input */}
                  <div className="flex items-end gap-2">
                    <Input
                      placeholder="Nhập tin nhắn..."
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={sending}
                      className="flex-1 min-h-[40px] resize-none"
                    />
                    
                    {/* File Upload */}
                    <input 
                      type="file" 
                      multiple 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      hidden 
                      accept={ALLOWED_TYPES.join(',')}
                    />
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => fileInputRef.current?.click()} 
                          disabled={sending}
                          className="h-10 w-10"
                        >
                          <Paperclip className="w-5 h-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Đính kèm file (Tối đa 10MB)</p>
                        <p className="text-xs text-gray-500">Hỗ trợ: hình ảnh, video, PDF, Word, Excel</p>
                      </TooltipContent>
                    </Tooltip>

                    <Button 
                      onClick={handleSendMessage} 
                      disabled={sending || (!message.trim() && files.length === 0)}
                      className="h-10"
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      {sending && <span>Đang gửi...</span>}
                    </Button>
                  </div>

                  {/* Drag & Drop Hint */}
                  {dragActive && (
                    <div className="mt-2 p-2 bg-blue-100 rounded text-center text-sm text-blue-800">
                      <Upload className="w-4 h-4 inline mr-1" />
                      Thả file vào đây để đính kèm
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Tin nhắn của bạn</h3>
                <p className="text-sm">Chọn một cuộc trò chuyện hoặc bắt đầu cuộc trò chuyện mới</p>
              </div>
            )}
          </div>
        </div>

        {/* === MODALS - GIỮ NGUYÊN === */}
        {/* Modal danh sách thành viên */}
        <Dialog open={openMembers} onOpenChange={setOpenMembers}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thành viên phòng chat</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-96">
              <div className="space-y-3 p-4">
                {members.map(member => {
                  const isMe = member.user_id === userId;
                  const isAdminInRoom = member.role === 'Admin';
                  return (
                    <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_id}`} />
                          <AvatarFallback>{member.first_name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.first_name} {member.last_name}
                            {isMe && " (Bạn)"}
                          </p>
                          <p className="text-xs text-gray-500">{member.position || "Chưa có chức vụ"}</p>
                          {isAdminInRoom && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Admin</span>}
                        </div>
                      </div>
                      {canManage && !isMe && !isAdminInRoom && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => setKickTarget({ userId: member.user_id, name: `${member.first_name} ${member.last_name}` })}
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Modal thêm thành viên */}
        <Dialog open={openAddMembers} onOpenChange={setOpenAddMembers}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm thành viên vào phòng</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Thành viên hiện tại ({members.length})</Label>
                <ScrollArea className="h-32 border rounded-md p-2 mt-2">
                  <div className="space-y-2">
                    {members.map(m => (
                      <div key={m.user_id} className="flex items-center gap-2 text-sm">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user_id}`} />
                          <AvatarFallback>{m.first_name[0]}</AvatarFallback>
                        </Avatar>
                        <span>{m.first_name} {m.last_name}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div>
                <Label>Chọn thành viên mới</Label>
                <p className="text-xs text-gray-500 mb-2">
                  {isAdmin ? "Tất cả nhân viên" : "Từ phòng ban của bạn"}
                </p>

                {addSelectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {addSelectedUsers.map(userId => {
                      const user = availableUsers.find(u => u.user_id === userId);
                      if (!user) return null;
                      return (
                        <span
                          key={userId}
                          className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full"
                        >
                          {user.first_name} {user.last_name}
                          <button onClick={() => removeAddSelectedUser(userId)} className="hover:text-blue-900">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="relative mb-2">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm thành viên..."
                    value={addSearchUser}
                    onChange={e => setAddSearchUser(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>

                <ScrollArea className="h-48 border rounded-md p-2">
                  {loadingUsers ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : filteredToAdd.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-6">
                      {addSearchUser ? "Không tìm thấy" : "Tất cả đã trong phòng"}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {filteredToAdd.map(user => {
                        const isSelected = addSelectedUsers.includes(user.user_id);
                        return (
                          <div
                            key={user.user_id}
                            onClick={() => toggleAddUser(user.user_id)}
                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all ${
                              isSelected ? "bg-blue-50 ring-1 ring-blue-500" : "hover:bg-gray-50"
                            }`}
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user_id}`} />
                              <AvatarFallback>{user.first_name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-xs text-gray-500">{user.position || "Chưa có chức vụ"}</p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setOpenAddMembers(false);
                setAddSelectedUsers([]);
                setAddSearchUser("");
              }}>
                Hủy
              </Button>
              <Button
                onClick={handleAddMembers}
                disabled={addSelectedUsers.length === 0 || addingMembers}
              >
                {addingMembers ? "Đang thêm..." : "Thêm thành viên"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm kick */}
        <AlertDialog open={!!kickTarget} onOpenChange={() => setKickTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa thành viên</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn xóa <strong>{kickTarget?.name}</strong> khỏi phòng chat này?
                Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleKick} className="bg-red-600 hover:bg-red-700">
                Xóa khỏi phòng
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal tạo phòng */}
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tạo phòng chat mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tên phòng</Label>
                <Input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="Nhập tên phòng..." />
              </div>
              <div>
                <Label>Loại phòng</Label>
                <Select value={newRoomType} onValueChange={(v: "Private" | "Group") => setNewRoomType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Private">Riêng tư (1:1)</SelectItem>
                    <SelectItem value="Group">Nhóm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Thành viên</Label>
                <p className="text-xs text-gray-500 mb-2">
                  {newRoomType === "Private"
                    ? "Chọn 1 người"
                    : isAdmin
                    ? "Chọn thành viên"
                    : "Chọn từ phòng ban của bạn"}
                </p>

                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {selectedUsers.map(userId => {
                      const user = availableUsers.find(u => u.user_id === userId);
                      if (!user) return null;
                      return (
                        <span
                          key={userId}
                          className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full"
                        >
                          {user.first_name} {user.last_name}
                          <button onClick={() => removeSelectedUser(userId)} className="hover:text-blue-900">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="relative mb-2">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm thành viên..."
                    value={searchUser}
                    onChange={e => setSearchUser(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>

                <ScrollArea className="h-48 border rounded-md p-2">
                  {loadingUsers ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-6">
                      {searchUser ? "Không tìm thấy" : "Không có thành viên nào"}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {filteredUsers.map(user => {
                        const isSelected = selectedUsers.includes(user.user_id);
                        return (
                          <div
                            key={user.user_id}
                            onClick={() => toggleUser(user.user_id)}
                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all ${
                              isSelected ? "bg-blue-50 ring-1 ring-blue-500" : "hover:bg-gray-50"
                            }`}
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user_id}`} />
                              <AvatarFallback>{user.first_name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-xs text-gray-500">{user.position || "Chưa có chức vụ"}</p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setOpenCreate(false); setSelectedUsers([]); setSearchUser(""); }}>
                Hủy
              </Button>
              <Button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || selectedUsers.length === 0 || creatingRoom}
              >
                {creatingRoom ? "Đang tạo..." : "Tạo phòng"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardWrapper>
    </TooltipProvider>
  );
}