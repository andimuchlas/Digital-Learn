export interface AnimalAvatar {
  id: string;
  label: string;
  src: string;
  bgGradient: string;
  borderColor: string;
}

export const ANIMAL_AVATARS: AnimalAvatar[] = [
  {
    id: "lion",
    label: "Singa",
    src: "/avatars/lion.jpg",
    bgGradient: "from-amber-400 to-orange-500",
    borderColor: "border-amber-500",
  },
  {
    id: "cat",
    label: "Kucing",
    src: "/avatars/cat.jpg",
    bgGradient: "from-orange-400 to-amber-500",
    borderColor: "border-orange-500",
  },
  {
    id: "panda",
    label: "Panda",
    src: "/avatars/panda.jpg",
    bgGradient: "from-sky-400 to-blue-500",
    borderColor: "border-sky-500",
  },
  {
    id: "fox",
    label: "Rubah",
    src: "/avatars/fox.jpg",
    bgGradient: "from-rose-400 to-red-500",
    borderColor: "border-rose-500",
  },
];

export function getAvatarSrc(avatarIdOrSrc?: string): string {
  if (!avatarIdOrSrc) return "/avatars/lion.jpg";
  if (avatarIdOrSrc.startsWith("/") || avatarIdOrSrc.startsWith("http")) return avatarIdOrSrc;
  const match = ANIMAL_AVATARS.find((a) => a.id === avatarIdOrSrc);
  if (match) return match.src;
  return "/avatars/lion.jpg";
}

export function getAvatarInfo(avatarIdOrSrc?: string): AnimalAvatar {
  const match = ANIMAL_AVATARS.find((a) => a.id === avatarIdOrSrc || a.src === avatarIdOrSrc);
  return match || ANIMAL_AVATARS[0];
}
