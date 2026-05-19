"use client";

import { useState, useEffect, useCallback } from "react";
import { notFound } from "next/navigation";
import { SectionedEditor } from "@/components/editors/SectionedEditor";
import { apiFetch } from "@/lib/api";
import type { SectionDef } from "@/lib/field-types";

type Params = { section: string };

// ─── Home (homePage doc) ─────────────────────────────────────────────
const HOME_SECTIONS: SectionDef[] = [
  {
    id: "hero",
    title: "Hero",
    description: "Top of the homepage — section tag, headline, subtitle, CTAs, trust strip.",
    visibleKey: "hero.visible",
    fields: [
      { key: "hero.sectionTag", kind: "text", label: "Section Tag", placeholder: "A new kind of mining" },
      { key: "hero.cornerLabelLeft", kind: "text", label: "Top-left corner label", placeholder: "[ 01 ] — Hashrate as a service", wide: true },
      { key: "hero.cornerLabelRight", kind: "textarea", label: "Top-right corner label", placeholder: "N 28°37′ · E 77°13′\nMining facility · live", rows: 2, wide: true },
      { key: "hero.headlineLine1", kind: "text", label: "Headline — line 1", placeholder: "Mine smarter," },
      { key: "hero.headlineItalic", kind: "text", label: "Headline — italic (mint)", placeholder: "earn everywhere" },
      { key: "hero.subtitleLines", kind: "textarea", label: "Subtitle (one line per row)", placeholder: "Industrial-grade hashrate, hosted hardware,\nand transparent payouts — built for retail\nminers and institutional desks since 2017.", rows: 3, wide: true, hint: "Each line is prefixed with // on the live site." },
      { key: "hero.primaryCta.label", kind: "text", label: "Primary CTA — label", placeholder: "Start Mining" },
      { key: "hero.primaryCta.href", kind: "text", label: "Primary CTA — URL", placeholder: "#plans" },
      { key: "hero.ghostCta.label", kind: "text", label: "Secondary CTA — label", placeholder: "View Plans" },
      { key: "hero.ghostCta.href", kind: "text", label: "Secondary CTA — URL", placeholder: "#plans" },
      { key: "hero.liveBadgeText", kind: "text", label: "Live miner badge", placeholder: "52,847 miners online now", wide: true },
      {
        key: "hero.trustStrip",
        kind: "array-object",
        label: "Trust Strip (below headline)",
        itemLabel: "Item",
        wide: true,
        schema: [
          { key: "value", kind: "text", label: "Value", placeholder: "1000+" },
          { key: "label", kind: "text", label: "Label", placeholder: "Units Sold" },
        ],
      },
      { key: "hero.btcPrice.visible", kind: "toggle", label: "Show BTC price pill", onLabel: "Visible", offLabel: "Hidden", wide: true, hint: "Shown next to the section tag at the top of the hero." },
      { key: "hero.btcPrice.value", kind: "text", label: "BTC price — value", placeholder: "₹ 58,42,310" },
      { key: "hero.btcPrice.label", kind: "text", label: "BTC price — label", placeholder: "BTC / INR" },
      { key: "hero.btcPrice.delta", kind: "text", label: "24h change", placeholder: "2.4%" },
      { key: "hero.btcPrice.deltaDirection", kind: "select", label: "Change direction", options: ["up", "down"] },
    ],
  },
  {
    id: "statsMarquee",
    title: "Stats Marquee",
    description: "Scrolling ticker strip just below the hero.",
    visibleKey: "statsMarquee.visible",
    fields: [
      {
        key: "statsMarquee.items",
        kind: "array-object",
        label: "Marquee Items",
        itemLabel: "Stat",
        wide: true,
        schema: [
          { key: "label", kind: "text", label: "Label", placeholder: "Total Hashrate" },
          { key: "value", kind: "text", label: "Display Value", placeholder: "2,840 PH/s" },
        ],
      },
    ],
  },
  {
    id: "statsGrid",
    title: "Stats Grid",
    description: "Four big-number stats with animated counters.",
    visibleKey: "statsGrid.visible",
    fields: [
      { key: "statsGrid.sectionTag", kind: "text", label: "Section Tag", placeholder: "02 / live numbers", wide: true },
      { key: "statsGrid.headlineLine1", kind: "text", label: "Headline — line 1", placeholder: "The receipts," },
      { key: "statsGrid.headlineLine2", kind: "text", label: "Headline — line 2", placeholder: "updated every block." },
      {
        key: "statsGrid.items",
        kind: "array-object",
        label: "Stat Cells",
        itemLabel: "Stat",
        wide: true,
        schema: [
          { key: "label", kind: "text", label: "Label", placeholder: "Network hashrate" },
          { key: "detail", kind: "text", label: "Sub-label", placeholder: "Across 4 facilities" },
          { key: "value", kind: "number", label: "Numeric value", placeholder: "2840" },
          { key: "prefix", kind: "text", label: "Prefix (e.g. $)", placeholder: "" },
          { key: "suffix", kind: "text", label: "Suffix (e.g. PH/s, %)", placeholder: " PH/s" },
          { key: "decimals", kind: "number", label: "Decimal places", placeholder: "0" },
        ],
      },
    ],
  },
  {
    id: "whyUs",
    title: "Why Us",
    description: "Brand-differentiator feature cards.",
    visibleKey: "whyUs.visible",
    fields: [
      { key: "whyUs.sectionTag", kind: "text", label: "Section Tag", placeholder: "04 / why us", wide: true },
      { key: "whyUs.headlineLine1", kind: "text", label: "Headline — line 1", placeholder: "Built different," },
      { key: "whyUs.headlineItalic", kind: "text", label: "Headline — italic (mint)", placeholder: "on purpose." },
      {
        key: "whyUs.features",
        kind: "array-object",
        label: "Feature Cards",
        itemLabel: "Card",
        wide: true,
        schema: [
          { key: "num", kind: "text", label: "Number", placeholder: "01" },
          { key: "title", kind: "text", label: "Title", placeholder: "Real hardware. Real watts." },
          { key: "body", kind: "textarea", label: "Description", placeholder: "No tokenized hashrate or paper claims.", rows: 3, wide: true },
        ],
      },
    ],
  },
  {
    id: "howItWorks",
    title: "How It Works",
    description: "Numbered horizontal-scroll process steps.",
    visibleKey: "howItWorks.visible",
    fields: [
      { key: "howItWorks.sectionTag", kind: "text", label: "Section Tag", placeholder: "05 / process", wide: true },
      { key: "howItWorks.headlinePrefix", kind: "text", label: "Headline — prefix", placeholder: "From signup to first payout" },
      { key: "howItWorks.headlineItalic", kind: "text", label: "Headline — italic ending", placeholder: "under a day." },
      {
        key: "howItWorks.steps",
        kind: "array-object",
        label: "Steps",
        itemLabel: "Step",
        wide: true,
        schema: [
          { key: "num", kind: "text", label: "Step number", placeholder: "01" },
          { key: "title", kind: "text", label: "Step title", placeholder: "Pick your plan" },
          { key: "body", kind: "textarea", label: "Description", placeholder: "Choose from Pebble, Boulder, or Mountain.", rows: 3, wide: true },
        ],
      },
    ],
  },
  {
    id: "teamSection",
    title: "Our Team",
    description: "Section heading + aside copy for the homepage Team slider. Add, edit, or remove individual team members from the sidebar — Content → Our Team.",
    visibleKey: "teamSection.visible",
    fields: [
      { key: "teamSection.sectionTag", kind: "text", label: "Section Tag", placeholder: "07 / our team", wide: true },
      { key: "teamSection.headlineLine1", kind: "text", label: "Headline — line 1", placeholder: "The people behind" },
      { key: "teamSection.headlineItalic", kind: "text", label: "Headline — italic (mint)", placeholder: "the rigs." },
      { key: "teamSection.asideText", kind: "textarea", label: "Aside text (right of headline)", placeholder: "Engineers, operators, and analysts running our Tier-3 facility 24/7. Edit each profile in Content → Team.", rows: 3, wide: true },
    ],
  },
  {
    id: "softwarePartnersSection",
    title: "Software Partners",
    description: "Section heading + aside copy for the homepage Software Partners block. Manage individual partner logos in the sidebar — Content → Software Partners.",
    visibleKey: "softwarePartnersSection.visible",
    fields: [
      { key: "softwarePartnersSection.sectionTag", kind: "text", label: "Section Tag", placeholder: "03 / partners", wide: true },
      { key: "softwarePartnersSection.headlineLine1", kind: "text", label: "Headline — line 1", placeholder: "Software" },
      { key: "softwarePartnersSection.headlineItalic", kind: "text", label: "Headline — italic (mint)", placeholder: "Partners." },
      { key: "softwarePartnersSection.asideText", kind: "textarea", label: "Aside text (right of headline)", placeholder: "The firmware, pools, and tooling we trust to run our facility — and you can use the same stack on rigs you buy from us.", rows: 3, wide: true },
    ],
  },
  {
    id: "faqs",
    title: "FAQ",
    description: "Accordion of questions and answers.",
    visibleKey: "faqs.visible",
    fields: [
      { key: "faqs.sectionTag", kind: "text", label: "Section Tag", placeholder: "06 / questions", wide: true },
      { key: "faqs.headlineLine1", kind: "text", label: "Headline — line 1", placeholder: "The honest" },
      { key: "faqs.headlineLine2", kind: "text", label: "Headline — line 2", placeholder: "answers." },
      {
        key: "faqs.items",
        kind: "array-object",
        label: "FAQ Items",
        itemLabel: "Question",
        wide: true,
        schema: [
          { key: "q", kind: "text", label: "Question", placeholder: "How is this different from cloud mining scams?", wide: true },
          { key: "a", kind: "textarea", label: "Answer", placeholder: "Most cloud mining is a paper claim...", rows: 4, wide: true },
        ],
      },
    ],
  },
  {
    id: "footerCta",
    title: "Footer CTA",
    description: "Full-bleed call-to-action and link bar at the bottom.",
    visibleKey: "footerCta.visible",
    fields: [
      { key: "footerCta.sectionTag", kind: "text", label: "Section Tag", placeholder: "ready when you are", wide: true },
      { key: "footerCta.headlinePrefix", kind: "text", label: "Headline — prefix", placeholder: "Start mining." },
      { key: "footerCta.headlineItalic", kind: "text", label: "Headline — italic (mint)", placeholder: "Today." },
      { key: "footerCta.cta.label", kind: "text", label: "CTA Button — label", placeholder: "Open my contract →" },
      { key: "footerCta.cta.href", kind: "text", label: "CTA Button — URL", placeholder: "#plans" },
      {
        key: "footerCta.quickLinks",
        kind: "array-object",
        label: "Quick links row",
        itemLabel: "Link",
        wide: true,
        schema: [
          { key: "label", kind: "text", label: "Label", placeholder: "Shop" },
          { key: "href", kind: "text", label: "URL", placeholder: "/shop" },
        ],
      },
      { key: "footerCta.copyright", kind: "text", label: "Copyright line", placeholder: "© 2026 Crypto Mining Miles · redefined mining · est 2017", wide: true },
      { key: "footerCta.coordinates", kind: "text", label: "Facility coordinates", placeholder: "N 28°37′12″ · E 77°13′08″ · New Delhi facility", wide: true },
    ],
  },
];

// ─── Shop ────────────────────────────────────────────────────────────
const SHOP_SECTIONS: SectionDef[] = [
  {
    id: "hero",
    title: "Page Hero",
    description: "Header section at the top of the Shop page.",
    visibleKey: "hero.visible",
    fields: [
      { key: "hero.tagNum", kind: "text", label: "Section number", placeholder: "01" },
      { key: "hero.tagLabel", kind: "text", label: "Section label", placeholder: "mining hardware" },
      { key: "hero.headline", kind: "text", label: "Headline", placeholder: "Pick your" },
      { key: "hero.italicWord", kind: "text", label: "Italic ending word", placeholder: "rig." },
      { key: "hero.mono", kind: "textarea", label: "Mono subtitle", placeholder: "real machines · real hashrate · daily BTC payouts", rows: 2, wide: true },
    ],
  },
  {
    id: "filters",
    title: "Filter Bar",
    description: "Algorithm filter chips above the product grid + GST note.",
    visibleKey: "filters.visible",
    fields: [
      { key: "filters.algos", kind: "array-string", label: "Filter chips (algorithms)", placeholder: "e.g. SHA-256", wide: true, hint: "First item is treated as the 'All' filter." },
      { key: "filters.gstNote", kind: "text", label: "GST badge text", placeholder: "+ 18% GST", wide: true },
    ],
  },
  {
    id: "emptyState",
    title: "Empty State",
    description: "Message shown when no products match the active filter.",
    visibleKey: "emptyState.visible",
    fields: [
      { key: "emptyState.title", kind: "text", label: "Title", placeholder: "No miners in this category yet.", wide: true },
      { key: "emptyState.body", kind: "text", label: "Body", placeholder: "check back soon — new hardware arrives monthly", wide: true },
    ],
  },
  {
    id: "trust",
    title: "Trust Strip",
    description: "Dark strip of icon + label + description cards near the page bottom.",
    visibleKey: "trust.visible",
    fields: [
      {
        key: "trust.items",
        kind: "array-object",
        label: "Trust Items",
        itemLabel: "Item",
        wide: true,
        schema: [
          { key: "icon", kind: "text", label: "Icon (emoji)", placeholder: "⚡" },
          { key: "label", kind: "text", label: "Label", placeholder: "Same-day activation" },
          { key: "desc", kind: "textarea", label: "Description", placeholder: "Contracts go live within 24h of payment", rows: 2, wide: true },
        ],
      },
    ],
  },
];

// ─── Profitability ───────────────────────────────────────────────────
const PROFITABILITY_SECTIONS: SectionDef[] = [
  {
    id: "hero",
    title: "Page Hero",
    description: "Header section for the Profitability calculator page.",
    visibleKey: "hero.visible",
    fields: [
      { key: "hero.tagNum", kind: "text", label: "Section number", placeholder: "02" },
      { key: "hero.tagLabel", kind: "text", label: "Section label", placeholder: "profit calculator" },
      { key: "hero.headline", kind: "text", label: "Headline", placeholder: "Know your" },
      { key: "hero.italicWord", kind: "text", label: "Italic ending word", placeholder: "numbers." },
      { key: "hero.mono", kind: "textarea", label: "Mono subtitle", placeholder: "live network difficulty · real electricity costs · no fluff", rows: 2, wide: true },
    ],
  },
  {
    id: "calculator",
    title: "Calculator",
    description: "Inputs, defaults, miner presets, and disclaimer text.",
    visibleKey: "calculator.visible",
    fields: [
      { key: "calculator.configHeading", kind: "text", label: "Inputs heading (mono)", placeholder: "CONFIGURE YOUR MINER" },
      { key: "calculator.resultsHeading", kind: "text", label: "Results heading (mono)", placeholder: "PROJECTED RETURNS" },
      { key: "calculator.defaults.electricityRate", kind: "number", label: "Default electricity ₹/kWh", placeholder: "8", unit: "₹/kWh" },
      { key: "calculator.defaults.months", kind: "number", label: "Default contract months", placeholder: "12", unit: "mo" },
      { key: "calculator.disclaimer", kind: "textarea", label: "Disclaimer text", placeholder: "Estimates based on current network difficulty...", rows: 3, wide: true },
      {
        key: "calculator.miners",
        kind: "array-object",
        label: "Miner Presets",
        itemLabel: "Miner",
        wide: true,
        schema: [
          { key: "name", kind: "text", label: "Name", placeholder: "Antminer S19 XP" },
          { key: "hashrate", kind: "number", label: "Hashrate", placeholder: "140" },
          { key: "power", kind: "number", label: "Power (W)", placeholder: "3010", unit: "W" },
          { key: "algo", kind: "select", label: "Algo", options: ["BTC", "ETH", "LTC", "KAS"] },
        ],
      },
    ],
  },
  {
    id: "faqs",
    title: "FAQ Cards",
    description: "Three FAQ cards at the bottom of the page.",
    visibleKey: "faqs.visible",
    fields: [
      { key: "faqs.sectionTag", kind: "text", label: "Section Tag", placeholder: "common questions", wide: true },
      {
        key: "faqs.items",
        kind: "array-object",
        label: "FAQ Cards",
        itemLabel: "Card",
        wide: true,
        schema: [
          { key: "q", kind: "text", label: "Question", placeholder: "Does the calculator include maintenance fees?", wide: true },
          { key: "a", kind: "textarea", label: "Answer", placeholder: "No, because we charge 0%...", rows: 3, wide: true },
        ],
      },
    ],
  },
];

// ─── Contact ─────────────────────────────────────────────────────────
const CONTACT_SECTIONS: SectionDef[] = [
  {
    id: "hero",
    title: "Page Hero",
    description: "Header section for the Contact page.",
    visibleKey: "hero.visible",
    fields: [
      { key: "hero.tagNum", kind: "text", label: "Section number", placeholder: "05" },
      { key: "hero.tagLabel", kind: "text", label: "Section label", placeholder: "contact us" },
      { key: "hero.headline", kind: "text", label: "Headline", placeholder: "Let's" },
      { key: "hero.italicWord", kind: "text", label: "Italic ending word", placeholder: "talk." },
      { key: "hero.mono", kind: "textarea", label: "Mono subtitle", placeholder: "sales · support · institutional desk · facility tours", rows: 2, wide: true },
    ],
  },
  {
    id: "methods",
    title: "Contact Methods",
    description: "Method cards (Phone, Email, Institutional Desk).",
    visibleKey: "methods.visible",
    fields: [
      {
        key: "methods.items",
        kind: "array-object",
        label: "Contact Method Cards",
        itemLabel: "Method",
        wide: true,
        schema: [
          { key: "icon", kind: "text", label: "Icon (emoji)", placeholder: "📞" },
          { key: "method", kind: "text", label: "Method name", placeholder: "Phone" },
          { key: "primary", kind: "text", label: "Primary line", placeholder: "+91 11 4000 0000", wide: true },
          { key: "secondary", kind: "text", label: "Secondary / hours", placeholder: "Mon–Sat, 9AM–7PM IST", wide: true },
          { key: "href", kind: "url", label: "Link URL", placeholder: "tel:+911140000000", wide: true },
          { key: "cta", kind: "text", label: "Button text", placeholder: "Call now" },
          { key: "accent", kind: "toggle", label: "Mint accent card", onLabel: "Yes — mint card", offLabel: "No — dark card" },
        ],
      },
    ],
  },
  {
    id: "facility",
    title: "Facility / Map",
    description: "Map placeholder card with coordinates + facility details.",
    visibleKey: "facility.visible",
    fields: [
      { key: "facility.sectionTag", kind: "text", label: "Section Tag", placeholder: "our facility", wide: true },
      { key: "facility.cityHeadline", kind: "text", label: "Headline", placeholder: "New Delhi" },
      { key: "facility.italicWord", kind: "text", label: "Italic ending", placeholder: "Data Center." },
      { key: "facility.coordsLine", kind: "text", label: "Coordinates line", placeholder: "N 28°37′12″ · E 77°13′08″", wide: true },
      { key: "facility.coordsLabel", kind: "text", label: "Coordinates label", placeholder: "New Delhi, India" },
      { key: "facility.mapCta.label", kind: "text", label: "Map button — label", placeholder: "Open in Maps →" },
      { key: "facility.mapCta.href", kind: "url", label: "Map button — URL", placeholder: "https://maps.google.com" },
      {
        key: "facility.details",
        kind: "array-object",
        label: "Facility Details",
        itemLabel: "Row",
        wide: true,
        schema: [
          { key: "label", kind: "text", label: "Label", placeholder: "Address" },
          { key: "value", kind: "text", label: "Value", placeholder: "Tier-3 Data Centre, Sector 62, Noida", wide: true },
        ],
      },
    ],
  },
  {
    id: "enquiryForm",
    title: "Enquiry Form",
    description: "Inline contact form — heading, subjects, submit label, success message.",
    visibleKey: "enquiryForm.visible",
    fields: [
      { key: "enquiryForm.heading", kind: "text", label: "Form heading (mono)", placeholder: "SEND AN ENQUIRY", wide: true },
      { key: "enquiryForm.subjects", kind: "array-string", label: "Subject options", placeholder: "e.g. General enquiry", wide: true },
      { key: "enquiryForm.submitLabel", kind: "text", label: "Submit button label", placeholder: "Send message" },
      { key: "enquiryForm.successTitle", kind: "text", label: "Success — title", placeholder: "Message sent!" },
      { key: "enquiryForm.successBody", kind: "textarea", label: "Success — body", placeholder: "We'll get back to you within 4 business hours.", rows: 2, wide: true },
    ],
  },
  {
    id: "numbersSection",
    title: "Numbers Strip",
    description: "Dark “Numbers don't negotiate” stats grid at the bottom of the page.",
    visibleKey: "numbersSection.visible",
    fields: [
      { key: "numbersSection.sectionTag", kind: "text", label: "Section Tag", placeholder: "by the numbers", wide: true },
      { key: "numbersSection.headlinePrefix", kind: "text", label: "Headline — prefix", placeholder: "Numbers don't" },
      { key: "numbersSection.headlineItalic", kind: "text", label: "Headline — italic", placeholder: "negotiate." },
      { key: "numbersSection.description", kind: "textarea", label: "Description (mono, right of headline)", placeholder: "Verified by our finance desk · audited quarterly · live on the public dashboard", rows: 2, wide: true },
      { key: "numbersSection.tickerLine", kind: "text", label: "Ticker line (below grid)", placeholder: "52,847 miners online · 184.2 EH/s network · last payout 47s ago", wide: true },
      {
        key: "numbersSection.stats",
        kind: "array-object",
        label: "Stat Cells",
        itemLabel: "Stat",
        wide: true,
        schema: [
          { key: "idx", kind: "text", label: "Index", placeholder: "01" },
          { key: "value", kind: "number", label: "Value", placeholder: "6" },
          { key: "prefix", kind: "text", label: "Prefix (e.g. ₹)", placeholder: "" },
          { key: "suffix", kind: "text", label: "Suffix (e.g. %, +)", placeholder: "+" },
          { key: "decimals", kind: "number", label: "Decimal places", placeholder: "0" },
          { key: "label", kind: "text", label: "Label", placeholder: "Years operating" },
          { key: "hint", kind: "text", label: "Hint (mono)", placeholder: "est. 2017", wide: true },
        ],
      },
    ],
  },
];

// ─── Service Request ─────────────────────────────────────────────────
const SERVICE_REQUEST_SECTIONS: SectionDef[] = [
  {
    id: "hero",
    title: "Page Hero",
    description: "Header section for the Service Request page.",
    visibleKey: "hero.visible",
    fields: [
      { key: "hero.tagNum", kind: "text", label: "Section number", placeholder: "03" },
      { key: "hero.tagLabel", kind: "text", label: "Section label", placeholder: "service request" },
      { key: "hero.headline", kind: "text", label: "Headline", placeholder: "We fix it," },
      { key: "hero.italicWord", kind: "text", label: "Italic ending word", placeholder: "fast." },
      { key: "hero.mono", kind: "textarea", label: "Mono subtitle", placeholder: "avg response time 2h · 24/7 ops team · ticket number issued instantly", rows: 2, wide: true },
    ],
  },
  {
    id: "whyCard",
    title: "Why Card",
    description: "Sticky dark card on the left — heading, features, direct contact.",
    visibleKey: "whyCard.visible",
    fields: [
      { key: "whyCard.sectionTag", kind: "text", label: "Section Tag", placeholder: "why choose us", wide: true },
      { key: "whyCard.headlinePrefix", kind: "text", label: "Headline — prefix", placeholder: "Ops team that" },
      { key: "whyCard.headlineItalic", kind: "text", label: "Headline — italic", placeholder: "never sleeps." },
      { key: "whyCard.directContact.phone", kind: "text", label: "Direct contact — phone", placeholder: "+91 11 4000 0000" },
      { key: "whyCard.directContact.email", kind: "email", label: "Direct contact — email", placeholder: "support@cryptominingmiles.in" },
      {
        key: "whyCard.features",
        kind: "array-object",
        label: "Feature Rows",
        itemLabel: "Feature",
        wide: true,
        schema: [
          { key: "icon", kind: "text", label: "Icon (emoji)", placeholder: "⚡" },
          { key: "title", kind: "text", label: "Title", placeholder: "Avg. 2h response" },
          { key: "desc", kind: "textarea", label: "Description", placeholder: "Critical tickets acknowledged within 15 minutes, 24/7.", rows: 2, wide: true },
        ],
      },
    ],
  },
  {
    id: "form",
    title: "Service Request Form",
    description: "Form heading, issue types, priority levels, submit button, success message.",
    visibleKey: "form.visible",
    fields: [
      { key: "form.heading", kind: "text", label: "Form heading (mono)", placeholder: "SERVICE REQUEST FORM", wide: true },
      { key: "form.submitLabel", kind: "text", label: "Submit button label", placeholder: "Submit Service Request" },
      { key: "form.successTitle", kind: "text", label: "Success — title", placeholder: "Ticket submitted!" },
      { key: "form.successBody", kind: "textarea", label: "Success — body (when no ticket id)", placeholder: "You'll receive a ticket number via email within 5 minutes.", rows: 2, wide: true },
      { key: "form.issueTypes", kind: "array-string", label: "Issue types", placeholder: "Hardware malfunction", wide: true },
      { key: "form.priorityLevels", kind: "array-string", label: "Priority levels", placeholder: "Low", wide: true },
    ],
  },
];

// ─── Track Ticket ────────────────────────────────────────────────────
const TRACK_TICKET_SECTIONS: SectionDef[] = [
  {
    id: "hero",
    title: "Page Hero",
    description: "Header section for the Track Ticket page.",
    visibleKey: "hero.visible",
    fields: [
      { key: "hero.tagNum", kind: "text", label: "Section number", placeholder: "04" },
      { key: "hero.tagLabel", kind: "text", label: "Section label", placeholder: "ticket tracker" },
      { key: "hero.headline", kind: "text", label: "Headline", placeholder: "Your fix," },
      { key: "hero.italicWord", kind: "text", label: "Italic ending word", placeholder: "live." },
      { key: "hero.mono", kind: "textarea", label: "Mono subtitle", placeholder: "real-time status · no refresh needed · on-site updates", rows: 2, wide: true },
    ],
  },
  {
    id: "lookup",
    title: "Lookup",
    description: "Ticket-ID search input, button label, hint, and not-found message.",
    visibleKey: "lookup.visible",
    fields: [
      { key: "lookup.placeholder", kind: "text", label: "Input placeholder", placeholder: "Enter ticket ID — e.g. CMM-2024-0042", wide: true },
      { key: "lookup.submitLabel", kind: "text", label: "Search button label", placeholder: "Track" },
      { key: "lookup.notFoundMessage", kind: "text", label: "Not-found error", placeholder: "No ticket found for that ID.", wide: true },
      { key: "lookup.emptyHint", kind: "text", label: "Empty-state hint", placeholder: "Enter your ticket ID to track its status in real time", wide: true },
    ],
  },
  {
    id: "escalation",
    title: "Escalation",
    description: "Footer under a ticket result with a 'contact support' link.",
    visibleKey: "escalation.visible",
    fields: [
      { key: "escalation.copy", kind: "text", label: "Helper copy", placeholder: "Need to escalate? Contact us directly.", wide: true },
      { key: "escalation.ctaLabel", kind: "text", label: "CTA label", placeholder: "Contact support →" },
      { key: "escalation.ctaHref", kind: "text", label: "CTA URL", placeholder: "/contact" },
    ],
  },
];

// ─── Nav / Footer (unchanged — separate models) ──────────────────────
const NAV_SECTIONS: SectionDef[] = [
  {
    id: "brand",
    title: "Brand",
    description: "Logo text and tagline shown in the navbar.",
    fields: [
      { key: "logo-primary", kind: "text", label: "Primary brand name", placeholder: "Crypto Mining Miles" },
      { key: "logo-tagline", kind: "text", label: "Tagline / sub-brand", placeholder: "redefined mining" },
    ],
  },
  {
    id: "links",
    title: "Nav Links",
    description: "Top-level navigation links.",
    fields: [
      { key: "links", kind: "array-object", label: "Navigation Items", itemLabel: "Link", wide: true, schema: [{ key: "label", kind: "text", label: "Link text", placeholder: "Products" }, { key: "href", kind: "text", label: "URL / anchor", placeholder: "/shop" }] },
    ],
  },
  {
    id: "cta",
    title: "CTA Button",
    description: "The primary button in the navbar (top-right).",
    fields: [
      { key: "cta-label", kind: "text", label: "Button text", placeholder: "Get Started" },
      { key: "cta-href", kind: "text", label: "URL", placeholder: "#plans" },
    ],
  },
  {
    id: "announcement",
    title: "Announcement Bar",
    description: "Optional announcement ribbon above the navbar.",
    fields: [
      { key: "enabled", kind: "toggle", label: "Show announcement bar", onLabel: "Visible", offLabel: "Hidden" },
      { key: "message", kind: "text", label: "Message text", placeholder: "🎉 New: KAS rigs now available. Limited stock →", wide: true },
    ],
  },
];

const FOOTER_SECTIONS: SectionDef[] = [
  {
    id: "brand",
    title: "Brand Block",
    description: "Logo and tagline in the footer left column.",
    fields: [
      { key: "logo", kind: "text", label: "Brand name", placeholder: "Crypto Mining Miles" },
      { key: "tagline", kind: "text", label: "Tagline", placeholder: "redefined mining" },
      { key: "address", kind: "textarea", label: "Address", placeholder: "Connaught Place, New Delhi — 110001\nIndia · GST: 07ABCDE1234F1Z5", rows: 3, wide: true },
    ],
  },
];

// ─── Section registry ────────────────────────────────────────────────
type PageConfig = {
  tag: string;
  title: string;
  description: string;
  sections: SectionDef[];
  loadEndpoint?: string;
  saveEndpoint: string;
  numericKeys?: Set<string>;
  multilineKeys?: Set<string>;
};

const HOME_NUMERIC = new Set([
  // inside statsGrid.items[]
  "value", "decimals",
]);
const PROFIT_NUMERIC = new Set([
  "calculator.defaults.electricityRate",
  "calculator.defaults.months",
  // inside calculator.miners[]
  "hashrate", "power",
]);
const CONTACT_NUMERIC = new Set([
  // inside numbersSection.stats[]
  "value", "decimals",
]);

const PAGE_CONFIGS: Record<string, PageConfig> = {
  home: {
    tag: "Content · Home",
    title: "Home Page",
    description: "Every block on the live homepage, in order — toggle to hide a section, edit any field to push to production.",
    sections: HOME_SECTIONS,
    loadEndpoint: "/home-pagedata",
    saveEndpoint: "/admin/update-home-page",
    numericKeys: HOME_NUMERIC,
    multilineKeys: new Set(["hero.subtitleLines"]),
  },
  shop: {
    tag: "Content · Shop",
    title: "Shop Page",
    description: "Edit the Shop page hero, filter bar, empty state, and trust strip.",
    sections: SHOP_SECTIONS,
    loadEndpoint: "/page/shop",
    saveEndpoint: "/admin/update-page/shop",
  },
  profitability: {
    tag: "Content · Profitability",
    title: "Profitability Calculator",
    description: "Edit the Profitability page hero, calculator inputs, miner presets, defaults, disclaimer, and FAQ cards.",
    sections: PROFITABILITY_SECTIONS,
    loadEndpoint: "/page/profitability",
    saveEndpoint: "/admin/update-page/profitability",
    numericKeys: PROFIT_NUMERIC,
  },
  contact: {
    tag: "Content · Contact",
    title: "Contact Page",
    description: "Edit the Contact page hero, contact methods, facility card, enquiry form, and the dark numbers strip at the bottom.",
    sections: CONTACT_SECTIONS,
    loadEndpoint: "/page/contact",
    saveEndpoint: "/admin/update-page/contact",
    numericKeys: CONTACT_NUMERIC,
  },
  "service-request": {
    tag: "Content · Service",
    title: "Service Request Page",
    description: "Edit the Service Request page hero, sticky 'why' card, and the form (issue types, priorities, labels).",
    sections: SERVICE_REQUEST_SECTIONS,
    loadEndpoint: "/page/service-request",
    saveEndpoint: "/admin/update-page/service-request",
  },
  "track-ticket": {
    tag: "Content · Track",
    title: "Track Ticket Page",
    description: "Edit the Track Ticket page hero, lookup form labels, and escalation footer.",
    sections: TRACK_TICKET_SECTIONS,
    loadEndpoint: "/page/track-ticket",
    saveEndpoint: "/admin/update-page/track-ticket",
  },
  nav: {
    tag: "Global · Navbar",
    title: "Navigation Bar",
    description: "Edit the nav brand, links, CTA button, and optional announcement bar.",
    sections: NAV_SECTIONS,
    loadEndpoint: "/get-nav",
    saveEndpoint: "/admin/update-nav",
  },
  footer: {
    tag: "Global · Footer",
    title: "Footer",
    description: "Edit footer brand block.",
    sections: FOOTER_SECTIONS,
    saveEndpoint: "/admin/update-home-page",
  },
};

// ─── Generic flatten / unflatten ─────────────────────────────────────

function flatten(prefix: string, obj: Record<string, unknown>, out: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(obj ?? {})) {
    if (k === "_id" || k === "__v" || k === "createdAt" || k === "updatedAt") continue;
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)) {
      flatten(path, v as Record<string, unknown>, out);
    } else {
      out[path] = v;
    }
  }
}

function unflatten(values: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    const parts = key.split(".");
    let cursor: Record<string, unknown> = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (typeof cursor[p] !== "object" || cursor[p] === null || Array.isArray(cursor[p])) {
        cursor[p] = {};
      }
      cursor = cursor[p] as Record<string, unknown>;
    }
    cursor[parts[parts.length - 1]] = value;
  }
  return result;
}

function buildInitialValues(config: PageConfig, raw: Record<string, unknown> | null): Record<string, unknown> {
  if (!raw) return {};
  const flat: Record<string, unknown> = {};
  flatten("", raw, flat);

  // multiline keys: collapse array<string> → string
  if (config.multilineKeys) {
    for (const mk of Array.from(config.multilineKeys)) {
      // The flatten emits each array element as mk.0, mk.1, ...
      const lines: string[] = [];
      let i = 0;
      while (true) {
        const key = `${mk}.${i}`;
        if (key in flat) {
          lines.push(String(flat[key] ?? ""));
          delete flat[key];
          i++;
        } else break;
      }
      if (lines.length > 0) flat[mk] = lines.join("\n");
    }
  }

  // normalise visibility values: undefined or true → "true", false → "false"
  for (const section of config.sections) {
    if (!section.visibleKey) continue;
    flat[section.visibleKey] = flat[section.visibleKey] === false ? "false" : "true";
  }

  return flat;
}

function buildSavePayload(config: PageConfig, values: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = { ...values };

  // visibility "true"/"false" → boolean
  for (const section of config.sections) {
    if (!section.visibleKey) continue;
    next[section.visibleKey] = next[section.visibleKey] !== "false";
  }

  // multiline: string → array (trim trailing blanks)
  if (config.multilineKeys) {
    for (const mk of Array.from(config.multilineKeys)) {
      if (typeof next[mk] === "string") {
        const lines = (next[mk] as string).split("\n");
        while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
        next[mk] = lines;
      }
    }
  }

  // coerce numeric keys for top-level + inside array-objects
  const coerceNumeric = (record: Record<string, unknown>, key: string) => {
    const v = record[key];
    if (v === undefined || v === null || v === "") return;
    const n = Number(v);
    if (!isNaN(n)) record[key] = n;
  };
  if (config.numericKeys) {
    // top-level dotted keys
    for (const k of Array.from(config.numericKeys)) {
      if (k.includes(".") && k in next) coerceNumeric(next, k);
    }
    // inside array-object rows
    for (const section of config.sections) {
      for (const field of section.fields) {
        if (field.kind !== "array-object") continue;
        const rows = next[field.key];
        if (!Array.isArray(rows)) continue;
        next[field.key] = rows.map((row) => {
          if (!row || typeof row !== "object") return row;
          const r = { ...(row as Record<string, unknown>) };
          for (const nk of Array.from(config.numericKeys!)) {
            if (!nk.includes(".") && nk in r) coerceNumeric(r, nk);
          }
          return r;
        });
      }
    }
  }

  // Drop keys not in our SectionDef set (defensive)
  const known = new Set<string>();
  for (const section of config.sections) {
    if (section.visibleKey) known.add(section.visibleKey);
    for (const f of section.fields) known.add(f.key);
  }
  const filtered: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(next)) {
    if (known.has(k)) filtered[k] = v;
  }

  return unflatten(filtered);
}

// ─── Page ────────────────────────────────────────────────────────────
export default function ContentSectionPage({ params }: { params: Params }) {
  const { section } = params;
  const config = PAGE_CONFIGS[section];

  const [initialValues, setInitialValues] = useState<Record<string, unknown> | undefined>(undefined);

  useEffect(() => {
    if (!config?.loadEndpoint) return;
    apiFetch<Record<string, unknown>>(config.loadEndpoint)
      .then((data) => {
        if (!config) return;
        if (section === "home") {
          const hp = (data.homePage ?? data) as Record<string, unknown>;
          setInitialValues(buildInitialValues(config, hp));
        } else if (section === "nav") {
          const links = (data.navLinks ?? data) as Record<string, unknown>[];
          const navLinks = (Array.isArray(links) ? links : []).filter((l) => l.group === "navbar");
          setInitialValues({ links: navLinks.map((l) => ({ label: l.label, href: l.href })) });
        } else {
          const page = (data.page ?? data) as Record<string, unknown>;
          setInitialValues(buildInitialValues(config, page));
        }
      })
      .catch(() => {});
  }, [section, config]);

  const onSaveAll = useCallback(
    async (values: Record<string, unknown>) => {
      if (!config) return;
      if (section === "nav") {
        const links = (values.links as { label: string; href: string }[]) ?? [];
        for (const link of links) {
          await apiFetch("/admin/create-nav", {
            method: "POST",
            body: JSON.stringify({ label: link.label, href: link.href, group: "navbar", sortOrder: links.indexOf(link) }),
          }).catch(() => {});
        }
        return;
      }
      const payload = buildSavePayload(config, values);
      await apiFetch(config.saveEndpoint, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    [section, config]
  );

  if (!config) notFound();

  return (
    <SectionedEditor
      pageTag={config.tag}
      pageTitle={config.title}
      pageDescription={config.description}
      sections={config.sections}
      initialValues={initialValues}
      onSaveAll={onSaveAll}
      onSaveSection={async (_id, v) => { await onSaveAll(v); }}
    />
  );
}
