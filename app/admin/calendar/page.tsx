Skip to content
nsairklima
ns-air-klima
Repository navigation
Code
Issues
Pull requests
Actions
Projects
Wiki
Security and quality
Insights
Settings
Files
Go to file
t
T
client-units content loaded
app
admin
calendar
page.tsx
items
page.tsx
test-email
page.tsx
page.tsx
api
admin
backup
route.ts
repair-quotes
route.ts
reset-public
reset
calendar
client-units
[unitId]
route.ts
clients
[id]
route.ts
items
maintenance
notifications
quote-items/[itemId]
quotes
send-quote
stats
test
clients
[id]
new
page.tsx
page.tsx
maintenance
quotes
globals.css
layout.tsx
page.tsx
lib
prisma
public
.env
.gitignore
next-env.d.ts
next.config.js
nsair logo.png
package-lock.json
package.json
tsconfig.json
vercel.json
ns-air-klima/app/admin/calendar
/
page.tsx
in
main

Edit

Preview
Indent mode

Spaces
Indent size

2
Line wrap mode

No wrap
Editing page.tsx file contents
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const TYPE_COLORS: Record<string, string> = {
  INSTALLATION: "#2ecc71", 
  MAINTENANCE: "#0078d7",  
  REPAIR: "#e74c3c"        
};

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newEntry, setNewEntry] = useState({ unitId: "", date: "", desc: "", type: "MAINTENANCE" });

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const fetchEvents = () => {
    fetch('/api/calendar').then(res => res.json()).then(data => {
      setEvents(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  };

  const fetchUnits = () => {
    fetch('/api/calendar/units', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setUnits(Array.isArray(data) ? data : []))
      .catch(err => console.error("Hiba:", err));
  };

  useEffect(() => {
    fetchEvents();
    fetchUnits();
  }, []);

  const handleSave = async () => {
    if (!newEntry.unitId || !newEntry.date) return alert("Válassz ügyfelet és dátumot!");
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId 
      ? { id: editingId, description: newEntry.desc, performedDate: newEntry.date, type: newEntry.type }
      : { unitId: newEntry.unitId, performedDate: newEntry.date, description: newEntry.desc, type: newEntry.type };
    const res = await fetch('/api/calendar', {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) { closeModal(); fetchEvents(); }
  };

  const handleDelete = async () => {
    if (!editingId || !confirm("Biztosan törlöd?")) return;
    const res = await fetch(`/api/calendar?id=${editingId}`, { method: 'DELETE' });
    if (res.ok) { closeModal(); fetchEvents(); }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
Use Control + Shift + m to toggle the tab key moving focus. Alternatively, use esc then tab to move to the next interactive element on the page.
Copied!
