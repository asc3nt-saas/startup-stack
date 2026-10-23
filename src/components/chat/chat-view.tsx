"use client";

import { format, isSameDay, isToday, isYesterday } from "date-fns";
import { ArrowLeft, Copy, LogOut, MessagesSquare, Plus, Send, UserPlus, Users } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { initials } from "@/components/shell/user-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, useRoomActions, useRoomMembers, useRoomMessages, useRooms, useSendMessage } from "@/lib/data/hooks";
import type { ChatMember, ChatMessage, ChatRoom } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#0ea5e9", "#8b5cf6", "#ef4444", "#14b8a6"];

function colorFor(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ member, id, className }: { member?: ChatMember; id: string; className?: string }) {
  return (
    <span
      className={cn("flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold text-white", className)}
      style={{ background: colorFor(id) }}
    >
      {member?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={member.avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        initials(member?.name)
      )}
    </span>
  );
}

export function ChatView() {
  const rooms = useRooms();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"create" | "join" | null>(null);
  const room = rooms.data?.find((r) => r.id === roomId) ?? null;

  return (
    <div className="-my-2 grid h-[calc(100dvh-8rem)] min-h-[480px] grid-cols-1 gap-4 md:grid-cols-[17rem_1fr]">
      <aside className={cn("flex min-h-0 flex-col gap-3", room && "hidden md:flex")}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Group chat</h1>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" onClick={() => setDialog("create")}>
            <Plus /> New group
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDialog("join")}>
            <UserPlus /> Join
          </Button>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {rooms.isLoading ? (
            [0, 1].map((i) => <Skeleton key={i} className="h-14" />)
          ) : rooms.data?.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No groups yet. Create one for your class, or join with an invite code.
            </p>
          ) : (
            rooms.data?.map((r) => <RoomItem key={r.id} room={r} active={r.id === roomId} onClick={() => setRoomId(r.id)} />)
          )}
        </div>
      </aside>

      <section className={cn("flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card", !room && "hidden md:flex")}>
        {room ? (
          <RoomPane key={room.id} room={room} onBack={() => setRoomId(null)} onLeft={() => setRoomId(null)} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <MessagesSquare className="size-10 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">Pick a group to start chatting.</p>
          </div>
        )}
      </section>

      <RoomDialog mode={dialog} onClose={() => setDialog(null)} onDone={(id) => setRoomId(id)} />
    </div>
  );
}

function RoomItem({ room, active, onClick }: { room: ChatRoom; active: boolean; onClick: () => void }) {
  const { data: messages } = useRoomMessages(room.id);
  const last = messages?.at(-1);
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-lg p-2.5 text-left transition",
        active ? "bg-accent" : "hover:bg-muted",
      )}
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
        style={{ background: colorFor(room.id) }}
      >
        {initials(room.name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{room.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{last?.body ?? "No messages yet"}</span>
      </span>
    </button>
  );
}

function dayLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, d MMMM");
}

function RoomPane({ room, onBack, onLeft }: { room: ChatRoom; onBack: () => void; onLeft: () => void }) {
  const { data: profile } = useProfile();
  const messages = useRoomMessages(room.id);
  const { data: members = [] } = useRoomMembers(room.id);
  const send = useSendMessage(room.id);
  const { leave } = useRoomActions();
  const [text, setText] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const me = profile?.id;

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m] as const)), [members]);
  const list = messages.data ?? [];

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [list.length]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    send.mutate(body);
    setText("");
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(room.inviteCode);
      toast.success(`Invite code ${room.inviteCode} copied`);
    } catch {
      toast(`Invite code: ${room.inviteCode}`);
    }
  }

  return (
    <>
      <header className="flex items-center gap-2 border-b px-3 py-3 sm:gap-3 sm:px-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack} aria-label="Back to groups">
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{room.name}</h2>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Users className="size-3" /> {members.map((m) => (m.id === me ? "You" : m.name.split(" ")[0])).join(", ")}
          </p>
        </div>
        <div className="hidden -space-x-2 sm:flex">
          {members.slice(0, 4).map((m) => (
            <Avatar key={m.id} id={m.id} member={m} className="size-7 ring-2 ring-card" />
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={copyInvite} title="Copy invite code">
          <Copy /> <span className="hidden font-mono sm:inline">{room.inviteCode}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Leave group"
          title="Leave group"
          onClick={() => {
            if (!confirm(`Leave ${room.name}?`)) return;
            leave.mutate(room.id, { onSuccess: onLeft });
          }}
        >
          <LogOut />
        </Button>
      </header>

      <div ref={scroller} className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-4">
        {messages.isLoading ? (
          <Skeleton className="h-40" />
        ) : list.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Say hi 👋 Share the invite code <span className="font-mono">{room.inviteCode}</span> with classmates.
          </p>
        ) : (
          list.map((m, i) => (
            <MessageRow
              key={m.id}
              message={m}
              previous={list[i - 1]}
              mine={m.userId === me}
              member={memberById.get(m.userId)}
            />
          ))
        )}
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${room.name}`}
          maxLength={4000}
          className="h-11"
        />
        <Button type="submit" size="icon" className="size-11" disabled={!text.trim()} aria-label="Send">
          <Send />
        </Button>
      </form>
    </>
  );
}

function MessageRow({
  message,
  previous,
  mine,
  member,
}: {
  message: ChatMessage;
  previous?: ChatMessage;
  mine: boolean;
  member?: ChatMember;
}) {
  const date = new Date(message.createdAt);
  const prevDate = previous ? new Date(previous.createdAt) : null;
  const newDay = !prevDate || !isSameDay(date, prevDate);
  // Group consecutive messages from the same person within 5 minutes.
  const grouped =
    !newDay && previous?.userId === message.userId && date.getTime() - prevDate!.getTime() < 5 * 60_000;

  return (
    <>
      {newDay && (
        <div className="flex items-center gap-3 py-3 text-[11px] font-medium text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> {dayLabel(date)} <span className="h-px flex-1 bg-border" />
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn("flex items-end gap-2", mine && "flex-row-reverse", !grouped && "pt-2")}
      >
        {!mine && (grouped ? <span className="w-8 shrink-0" /> : <Avatar id={message.userId} member={member} />)}
        <div className={cn("flex max-w-[75%] flex-col", mine ? "items-end" : "items-start")}>
          {!mine && !grouped && (
            <span className="mb-0.5 ml-1 text-xs font-medium" style={{ color: colorFor(message.userId) }}>
              {member?.name ?? "Student"}
            </span>
          )}
          <div
            className={cn(
              "whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm",
              mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted",
            )}
          >
            {message.body}
            <span className={cn("ml-2 align-bottom text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
              {format(date, "HH:mm")}
            </span>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function RoomDialog({
  mode,
  onClose,
  onDone,
}: {
  mode: "create" | "join" | null;
  onClose: () => void;
  onDone: (roomId: string) => void;
}) {
  const { create, join } = useRoomActions();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = String(new FormData(e.currentTarget).get("value")).trim();
    if (!value) return;
    const room = mode === "create" ? await create.mutateAsync(value) : await join.mutateAsync(value);
    if (mode === "create") toast.success(`Group created. Invite code: ${room.inviteCode}`);
    onDone(room.id);
    onClose();
  }

  return (
    <Dialog open={mode !== null} onOpenChange={(o) => !o && onClose()}>
      {mode && (
        <DialogContent
          title={mode === "create" ? "New group" : "Join a group"}
          description={mode === "create" ? "You'll get an invite code to share with classmates." : "Ask a classmate for the group's invite code."}
        >
          <form key={mode} onSubmit={onSubmit} className="space-y-4">
            <Field label={mode === "create" ? "Group name" : "Invite code"}>
              <Input
                name="value"
                placeholder={mode === "create" ? "e.g. Physics 101 study group" : "e.g. a1b2c3"}
                className={mode === "join" ? "font-mono" : undefined}
                required
                autoFocus
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending || join.isPending}>
                {mode === "create" ? "Create group" : "Join group"}
              </Button>
            </div>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
