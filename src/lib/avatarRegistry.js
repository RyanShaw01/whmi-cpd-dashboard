import { useState, useEffect } from "react";
import {
  Bone, Waves, Magnet, Radiation, Stethoscope, Ghost,
  Building2, Syringe, Pill, Thermometer, Microscope, Brain, Eye, Briefcase, ClipboardList, Sun, Donut, Bandage, Cookie,
} from "lucide-react";
import { SkullIcon, HandBonesIcon, PlusOutlineIcon } from "../components/customIcons";
import { supabase } from "./supabaseClient";

// Every "builtin" avatar icon row (kind: 'builtin') stores an icon_key referencing one of
// these components — this is the only place a new builtin icon needs to be registered.
export const BUILTIN_ICONS = {
  bone: Bone, waves: Waves, magnet: Magnet, radiation: Radiation, stetho: Stethoscope, ghost: Ghost,
  skull: SkullIcon, hand: HandBonesIcon, cross: PlusOutlineIcon, hospital: Building2, syringe: Syringe,
  pill: Pill, thermometer: Thermometer, microscope: Microscope, brain: Brain, eye: Eye, briefcase: Briefcase,
  clipboard: ClipboardList, sun: Sun, donut: Donut, bandage: Bandage, cookie: Cookie,
};

// Module-level cache + tiny pub/sub so every CharacterAvatar/AvatarPicker instance re-renders
// when App.jsx loads (or an admin edits) the DB-backed icon/colour lists, without threading
// them as props through every place an avatar is rendered.
let icons = [];
let colors = [];
const iconListeners = new Set();
const colorListeners = new Set();

export function setAvatarIcons(list) { icons = list; iconListeners.forEach(fn => fn(icons)); }
export function setAvatarColors(list) { colors = list; colorListeners.forEach(fn => fn(colors)); }
export function getAvatarIcons() { return icons; }
export function getAvatarColors() { return colors; }

export function useAvatarIcons() {
  const [list, setList] = useState(icons);
  useEffect(() => {
    const fn = (l) => setList(l);
    iconListeners.add(fn);
    return () => iconListeners.delete(fn);
  }, []);
  return list;
}
export function useAvatarColors() {
  const [list, setList] = useState(colors);
  useEffect(() => {
    const fn = (l) => setList(l);
    colorListeners.add(fn);
    return () => colorListeners.delete(fn);
  }, []);
  return list;
}

export function iconImageUrl(row) {
  if (!row || row.kind !== "image" || !row.imagePath || !supabase) return null;
  return supabase.storage.from("avatar-icons").getPublicUrl(row.imagePath).data.publicUrl;
}
export function resolveColorHex(name) {
  const c = colors.find(x => x.name === name);
  return c?.hex || null;
}
