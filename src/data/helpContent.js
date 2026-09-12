/*
 * Written guides for the Help Centre, grounded in how the app actually behaves.
 * `imagePending: true` marks articles slated for an annotated screenshot once one's
 * captured and dropped into src/assets/help/ (set `image: { src, alt }` at that point).
 * `adminOnly: true` marks articles describing an admin/owner-only action; HelpCentre.jsx
 * hides these from viewer-role sessions.
 */
export const HELP_CATEGORIES = [
  { id: "getting-started", label: "Getting Started" },
  { id: "events", label: "Managing Events" },
  { id: "registrations", label: "Registrations & Attendance" },
  { id: "certificates", label: "Certificates & Reflections" },
  { id: "reports", label: "Reports & Analytics" },
  { id: "troubleshooting", label: "Troubleshooting" },
];

export const HELP_ARTICLES = [
  {
    id: "logging-in",
    category: "getting-started",
    title: "Logging in",
    imagePending: true,
    steps: [
      "Go to the dashboard's sign-in screen and enter your **email address**.",
      "Complete the quick **verification check**, then select **Send Code**.",
      "Check your inbox for a **6-digit code** and enter it on the next screen.",
      "First time signing in? You'll be walked through a short **onboarding step** to set up your name and profile picture.",
      "You'll land on the **Dashboard** (admin/owner) or **My CPD** (viewer/external), depending on your account type.",
    ],
    note: "No password is needed. Western Health staff (@wh.org.au) are recognised automatically; anyone else can still sign in with an external account.",
  },
  {
    id: "roles",
    category: "getting-started",
    title: "Understanding your role",
    steps: [
      "**Admin** and **Owner** can manage events, staff, registrations, and certificates across the whole team.",
      "**Viewer** is a personal account for staff to browse upcoming CPD, register for events, and track their own CPD hours and certificates on the My CPD page.",
      "**External** viewers are a special kind of Viewer for people outside Western Health: they see only events open to external participants, their own registrations, recordings, and certificates.",
      "Your role is set by an Admin or Owner in **Settings → Team Access**.",
    ],
  },
  {
    id: "sidebar",
    category: "getting-started",
    title: "Finding your way around the sidebar",
    steps: [
      "**Admins and owners** see: Dashboard, Upcoming Events, Previous Events, Reflections, Staff, Certificates, CPD Brainstorming, Reports & Analytics, Help Centre, and Settings. Everything below the **Education Team Access** divider is admin-only.",
      "**Western Health staff (viewer accounts)** see: My CPD, My Certificates, Upcoming Events, Previous Events, Reflections, Help Centre, and Settings.",
      "**External accounts** see the same minus the event pages: My CPD, My Certificates, Reflections, Help Centre, and Settings.",
      "Click the **collapse arrow** at the bottom of the sidebar to shrink it to icons only.",
    ],
  },

  {
    id: "create-event",
    category: "events",
    adminOnly: true,
    title: "Creating a new event",
    steps: [
      "From the Dashboard, click **Add/Edit Event** (or **New Event** on the Upcoming Events page).",
      "Fill in the **title**, description, and learning objectives.",
      "Choose a **primary topic** and add tags.",
      "Add **presenter(s)**, organisers, and supporting staff.",
      "Set the **date, start and finish time**; duration is calculated automatically.",
      "Choose the **mode** (In-person / Online / Hybrid), location, and, for online/hybrid, a Teams link.",
      "Set total **capacity** (and separate online/in-person capacity for Hybrid events).",
      "Pick a **CPD type**, if this activity matches one, so the right ASMIRT-endorsed appellation code appears on generated certificates.",
      "Choose how **reflections are collected**: a direct link, a QR code on your slides, or automatic email.",
      "Toggle **\"Open to external participants\"** on or off, depending on who should be able to see and register for it.",
      "Save as **Draft**, or set the status straight to **Registration Open** once you're ready for staff to see it.",
    ],
  },
  {
    id: "event-status",
    category: "events",
    adminOnly: true,
    title: "Understanding event statuses",
    steps: [
      "**Draft**: not visible to staff.",
      "**Awaiting Approval**: under review, still not visible to staff.",
      "**Registration Open**: visible and bookable by staff (and external accounts, if opted in).",
      "**Open (No Registration Needed)**: visible to everyone the same as Registration Open, but there's no Register button and no attendance is collected - for anything you just want to list (an external conference, a drop-in session).",
      "**Registration Closed**: no longer taking new sign-ups.",
      "**Completed**: the event has happened; it now lives in Previous Events.",
      "**Archived**: kept for records, out of the active list.",
    ],
    note: "Only \"Registration Open\" and \"Open (No Registration Needed)\" events appear to staff browsing Upcoming Events. You can change the status any time from the event's detail view.",
  },
  {
    id: "event-files",
    category: "events",
    adminOnly: true,
    title: "Uploading flyers, slides, handouts & supporting files",
    steps: [
      "Open the event and click the **edit (pencil) icon**, or go to its Files tab if it's a past event.",
      "Under **Files**, click **Upload** next to Promotional Flyer, Presentation Slides, Handouts, or Supporting File.",
      "Choose the file; it uploads immediately and appears as a download link.",
      "Click the **trash icon** next to a file to remove it.",
    ],
    note: "Files are stored in Supabase Storage and linked permanently to the event, including after it moves to Previous Events.",
  },
  {
    id: "reflection-method",
    category: "events",
    adminOnly: true,
    title: "Choosing how reflections are collected",
    steps: [
      "On the event form, set **\"Reflection Collection Method\"** to Direct web link, QR code on slides, or Automatic email after event.",
      "Whichever you choose, the **same reflection form** is used; the method just determines how attendees find it.",
      "The **QR Code(s) tab** on the event (once published) generates a printable code that links straight to the reflection form.",
    ],
  },
  {
    id: "share-event",
    category: "events",
    adminOnly: true,
    title: "Sharing an event with a QR code or link",
    imagePending: true,
    steps: [
      "Open the event and go to its **QR Code(s) tab** (admins only).",
      "The **Registration Link** code opens the public event page to register; print it on posters or flyers.",
      "The **Online Event Link** code (once a meeting link is added) joins the online meeting directly; share it only with confirmed attendees.",
      "Or click **\"Copy Link\"** on the Overview tab to share the public event page directly.",
    ],
    note: "Anyone with the registration link can view the event and register; no login required.",
  },

  {
    id: "how-registration-works",
    category: "registrations",
    adminOnly: true,
    title: "How staff register for an event",
    imagePending: true,
    steps: [
      "**Logged-in staff** can register from the event card (Upcoming Events or My CPD); their name and email are pre-filled.",
      "**Anyone with the public event link** can also register without logging in.",
      "If they later **sign in for real** with that same email, their registration history is linked to their account automatically.",
      "**External accounts** register the same way, from their My CPD page's Browse & Register section.",
    ],
  },
  {
    id: "capacity-waitlist",
    category: "registrations",
    title: "Capacity limits and waitlists",
    steps: [
      "Once an event's active registrations reach its **capacity**, new registrants are automatically placed on the **waitlist** instead.",
      "If someone already registered is later marked **Cancelled** or **No Show**, the earliest person on the waitlist is automatically **promoted to Registered**.",
      "No manual action is needed for the promotion to happen.",
    ],
  },
  {
    id: "marking-attendance",
    category: "registrations",
    adminOnly: true,
    title: "Marking attendance",
    steps: [
      "Open the event and go to its **Registrations** (or Attendance, for past events) tab.",
      "Find the registrant and use the **status dropdown** to set Registered, Attended, No Show, Cancelled, or Waitlisted.",
      "For **Hybrid events**, you can also toggle whether they attended In-person or Online.",
    ],
    note: "Attendance status drives a lot downstream: Dashboard/Reports stats, certificate eligibility, and waitlist promotion all read from it.",
  },
  {
    id: "duplicate-detection",
    category: "registrations",
    adminOnly: true,
    title: "Resolving duplicate registration or reflection warnings",
    steps: [
      "A warning banner appears when two registrations (or reflections) look like the **same person**: a matching email, or a very similar name.",
      "**Merge** combines them, keeping the earlier record and filling in any details only the duplicate had.",
      "**Keep Separate** and **Ignore** both dismiss the warning without changing any data, and it won't reappear for that pair.",
    ],
  },

  {
    id: "reflection-form",
    category: "certificates",
    adminOnly: true,
    title: "What attendees see on the reflection form",
    steps: [
      "**Name and email**, pre-filled if they're logged in.",
      "A **written reflection**, with a suggested structure aligned to MRPBA requirements.",
      "**0-10 ratings** for quality and relevance, and how appropriate the level was.",
      "Three short **follow-up questions**.",
    ],
    note: "Name, email, and the written reflection are required; the form validates and highlights anything missing, and asks for confirmation before sending.",
  },
  {
    id: "auto-certificates",
    category: "certificates",
    adminOnly: true,
    title: "How automatic certificates work",
    steps: [
      "Once an event has finished, a registered attendee sees a **\"Leave Feedback & Get Certificate\"** button on the event, or in their My CPD **\"Needs Your Feedback\"** section.",
      "They fill in and submit the **reflection form**.",
      "A **CPD certificate PDF** is generated automatically from the event's details (name, session, date, hours, appellation code) and emailed to them immediately, along with a copy of their reflection.",
      "**30 minutes** after an event ends, registered staff who haven't reflected yet automatically get a reminder email inviting them to do so.",
    ],
    note: "If the automatic email fails to send for any reason, the certificate is queued as \"Awaiting Approval\" instead of being lost; check the Certificates page.",
  },
  {
    id: "manual-certificates",
    category: "certificates",
    adminOnly: true,
    title: "Approving certificates, or creating one for someone with no account",
    steps: [
      "Go to the **Certificates** page from the sidebar.",
      "Certificates **awaiting approval** are listed with the staff member and event; click **Approve** to mark one as Sent, or the delete icon to remove it.",
      "To create a certificate directly, click **Create Certificate** (or the **Make Certificate** quick action on the Dashboard).",
      "Fill in the **recipient's name, email, session name, date, and CPD hours**, and pick a CPD type if one applies.",
      "The certificate generates immediately with a **Download PDF** link; this is for people who don't have an account in the system, and they'll appear under Staff → Certificate Recipients.",
    ],
  },
  {
    id: "find-event-certificates",
    category: "certificates",
    adminOnly: true,
    title: "Finding all certificates and feedback for an event",
    steps: [
      "Go to **Previous Events** and open the event.",
      "The **stat band** shows Attended, No-show, Avg Feedback, and Certificates Sent; click any of them to jump straight to the relevant tab.",
      "The **Certificates tab** groups recipients into Sent, Awaiting Approval, and Awaiting Reflection (registered but haven't submitted feedback yet, so no certificate exists for them).",
      "The **Reflections tab** shows an average quality/relevance/appropriateness breakdown plus every individual reflection, searchable.",
    ],
  },

  {
    id: "dashboard-stats",
    category: "reports",
    adminOnly: true,
    title: "Reading the Dashboard",
    imagePending: true,
    steps: [
      "**CPD Hours Delivered** sums the duration of every completed event this year.",
      "**Current Registrations** counts active sign-ups across open events.",
      "**Certificates Awaiting Approval** and **Outstanding Reflections** flag things that need attention.",
      "The **charts below** show CPD hours by month and the in-person/online split of completed events.",
    ],
    note: "All stat cards are live, computed directly from real event, registration, and certificate data.",
  },
  {
    id: "exporting-reports",
    category: "reports",
    adminOnly: true,
    title: "Exporting reports",
    steps: [
      "Go to **Reports & Analytics**.",
      "Click **Export Excel** for a CSV (opens directly in Excel) with one row per event: attendance, no-shows, feedback, and CPD hours.",
      "Click **Export PDF** for a one-page summary PDF with the same figures, generated in your browser.",
    ],
  },
  {
    id: "previous-events-calendar",
    category: "reports",
    adminOnly: true,
    title: "Using the Previous Events calendar view",
    steps: [
      "On the **Previous Events** page, switch from Table to **Calendar** view.",
      "Pick a **year** to see every completed event laid out across a 12-month calendar.",
      "**Days with an event** are highlighted; click one to open that event's full archive view.",
    ],
  },

  {
    id: "trouble-not-saving",
    category: "troubleshooting",
    adminOnly: true,
    title: "Something I entered doesn't seem to have saved",
    steps: [
      "Check your **internet connection** and try again; the app needs a live connection to Supabase to save changes.",
      "If the problem persists, check the **browser console** for an error (right-click → Inspect → Console).",
      "Share the error with whoever manages the Supabase project; most save failures come from a database migration not having been run yet.",
    ],
  },
  {
    id: "trouble-duplicate-wont-clear",
    category: "troubleshooting",
    adminOnly: true,
    title: "A duplicate warning won't go away",
    steps: [
      "Use **Keep Separate** or **Ignore** if the two records really are different people; either option dismisses the warning permanently for that specific pair.",
      "If they're genuinely the **same person**, use **Merge** instead, which also removes the warning.",
    ],
  },
  {
    id: "trouble-no-certificate-email",
    category: "troubleshooting",
    adminOnly: true,
    title: "An attendee says their certificate email never arrived",
    steps: [
      "Check the **Certificates page**; if it's listed as \"Awaiting Approval\" rather than \"Sent\", the automatic email failed and needs manual approval.",
      "Double-check their **email address** is correct; approval re-triggers nothing automatically.",
      "Ask them to check **spam/junk**.",
      "If you're still testing on Resend's shared sending domain rather than a verified wh.org.au address, delivery can be less reliable; that's expected until a verified domain is set up.",
    ],
  },
  {
    id: "trouble-missing-pages",
    category: "troubleshooting",
    title: "I can't see Reports, Staff or Certificates",
    steps: [
      "**Reports & Analytics**, **Staff**, **Certificates** and **CPD Brainstorming** are only available to **Admin** and **Owner** roles.",
      "**Upcoming Events** and **Previous Events** are available to Western Health staff accounts, but not to external accounts - those are scoped to events shared externally, which appear on your **My CPD** page instead.",
      "Your own records are always available to you under **My CPD**, **My Certificates** and **Reflections**.",
      "Ask an Admin to change your role in **Settings → Team Access** if you believe you should have more access.",
    ],
  },
/* ---- Written for viewers (WH staff and external participants), in second person.
     Everything above that describes the same flow is written from the Education Team's
     side and is tagged adminOnly. ---- */
  {
    id: "viewer-orientation",
    category: "getting-started",
    title: "What you can do here",
    steps: [
      "**My CPD** is your home page: what's coming up, anything still needing your feedback, and the CPD you've already done.",
      "**My Certificates** lists every certificate issued to you, with your total CPD hours and a download link for each one.",
      "**Reflections** holds your written reflections - both from Western Health events and any other CPD you want to record.",
      "**Settings** is where you change your display name, profile picture and colour theme.",
    ],
    note: "You don't need to set anything up. Register for an event, attend it, fill in the reflection form afterwards, and your certificate arrives by email.",
  },
  {
    id: "viewer-register",
    category: "registrations",
    title: "Registering for an event",
    steps: [
      "Open **My CPD** (or **Upcoming Events** if you're Western Health staff) and find the event you want.",
      "Select **Register** on the event card. If you're signed in, your name and email are filled in for you.",
      "You'll get a confirmation email with the date, time and location.",
      "To cancel, open the same event and choose **Unregister**.",
    ],
    note: "You can also register from a link or QR code without signing in at all. If you later sign in with that same email address, those registrations are linked to your account automatically.",
  },
  {
    id: "viewer-get-certificate",
    category: "certificates",
    title: "How to get your CPD certificate",
    steps: [
      "Attend the event you registered for.",
      "After it finishes, open the **reflection form** - from the link in your email, from the **Needs Your Feedback** panel on My CPD, or from the event itself.",
      "Fill it in and submit it.",
      "Your certificate PDF is generated and emailed to you straight away, along with a copy of your reflection.",
    ],
    note: "The reflection is what triggers the certificate - without it, no certificate is issued. If you haven't filled one in about half an hour after the event ends, you'll get a reminder email.",
  },
  {
    id: "viewer-reflection-form",
    category: "certificates",
    title: "Filling in the reflection form",
    steps: [
      "**Your name and email** - already filled in if you're signed in. The certificate is sent to this address, so check it's right.",
      "**Your reflection** - what you learned, why it was relevant to your role, and how it might change your practice. There's a suggested structure on the form.",
      "**Two 0-10 sliders** for the quality and relevance of the session, and one question on whether the level suited you.",
      "**Three optional questions** on what was most valuable, what could be improved, and what you'd like to see in future.",
    ],
    note: "Name, email and the written reflection are required; everything else is optional. The MRPBA requires you to keep evidence of reflection, which is why the form asks for it.",
  },
  {
    id: "viewer-cpd-hours",
    category: "certificates",
    title: "Finding your CPD hours",
    steps: [
      "**My Certificates** shows your total CPD hours across every certificate issued to you, and the hours attached to each one.",
      "**My CPD** shows the same total plus your hours for the current year, in the stat cards at the top.",
      "Select any certificate's **Download** button to save the PDF as evidence.",
    ],
    note: "Hours are counted from issued certificates only. If you attended something but never filled in the reflection, those hours won't appear.",
  },
  {
    id: "viewer-external-cpd",
    category: "certificates",
    title: "Recording CPD you did somewhere else",
    steps: [
      "Go to **Reflections** and choose **Add Reflection**.",
      "Enter the **activity name** and **date** - a conference, a course, a journal club, anything.",
      "Pick a format: **Full Template** (structured questions), **Short Form** (a handful), or **Freestyle** (just write).",
      "Answer as much or as little as you like, then **Save Reflection**.",
    ],
    note: "These sit alongside your Western Health reflections but stay clearly separated. Use the mail button on any reflection to email yourself a copy for your own records.",
  },
  {
    id: "viewer-certificate-pending",
    category: "troubleshooting",
    title: "My certificate says \"Being prepared\"",
    steps: [
      "This means your reflection came through, but the certificate needs a quick check by the Education Team before it's sent.",
      "**There's nothing you need to do.** You'll get an email as soon as it's issued.",
      "If it's been more than a few working days, contact the Education Team.",
    ],
  },
  {
    id: "viewer-no-certificate",
    category: "troubleshooting",
    title: "My certificate hasn't arrived",
    steps: [
      "Check **My Certificates** first - if it's listed there as **Issued**, use the **Download** button to get the PDF directly, whatever happened to the email.",
      "Check your **junk or spam folder**.",
      "Make sure you actually submitted the **reflection form** - the certificate is only created once that's done. Anything still outstanding shows on **My CPD** under **Needs Your Feedback**.",
      "Check the email address on the reflection was correct; the certificate goes to whatever address was entered there.",
      "Still nothing? Contact the Education Team and they can re-issue it.",
    ],
  },
  {
    id: "viewer-profile",
    category: "getting-started",
    title: "Changing your name, photo or theme",
    steps: [
      "Open **Settings** from the bottom of the sidebar, or select your avatar in the top right.",
      "Under **Your Profile**, change your display name or pick a new avatar icon and colour, then **Save Profile**.",
      "Use the theme control in the top-right of the header to switch between **Light**, **Dark** and **Navy**.",
    ],
    note: "Your email address can't be changed here, since it's what you sign in with - ask the Education Team if it needs updating.",
  },
];
