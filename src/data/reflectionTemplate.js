// The full structured reflection question set and its short-form variant, used by the
// Reflection tab's "Add Reflection" form for non-WH CPD activities.
export const REFLECTION_SECTIONS = [
  {
    id: "understanding",
    label: "Understanding",
    questions: [
      "What were the key learning points from this activity?",
      "What new knowledge or skills did you gain?",
      "What surprised you during this activity?",
      "How has this activity changed your understanding of the topic?",
    ],
  },
  {
    id: "relevance",
    label: "Relevance",
    questions: [
      "Why is this learning relevant to your current role?",
      "How does this relate to your day-to-day practice?",
      "Which aspects of this activity are most applicable to your workplace?",
      "How does this learning support better patient care or service delivery?",
    ],
  },
  {
    id: "reflection",
    label: "Reflection",
    questions: [
      "What challenged your existing knowledge or assumptions?",
      "Did anything reinforce your current practice? If so, what?",
      "What aspects of your practice could be improved based on this learning?",
      "What questions do you still have after completing this activity?",
    ],
  },
  {
    id: "application",
    label: "Application",
    questions: [
      "How will you apply this learning in your workplace?",
      "What is one specific change you will make as a result of this activity?",
      "What barriers might prevent you from implementing this learning?",
      "How will you overcome those barriers?",
    ],
  },
  {
    id: "impact",
    label: "Impact",
    questions: [
      "What difference do you expect this learning to make for patients, colleagues, or your organisation?",
      "How will you know if this learning has improved your practice?",
      "What outcomes will you look for after implementing this learning?",
    ],
  },
  {
    id: "future",
    label: "Future Development",
    questions: [
      "What further learning do you need on this topic?",
      "What are your next steps for developing this area of practice?",
      "Is there another CPD activity that would complement this learning?",
      "How will you continue to build on what you've learned?",
    ],
  },
];

export const REFLECTION_SHORT_FORM = {
  id: "short-form",
  label: "Short Form",
  questions: [
    "What were the key learning points from this CPD activity?",
    "How is this learning relevant to your professional practice?",
    "What will you do differently as a result of this learning?",
    "How will you know this change has improved your practice?",
  ],
};
