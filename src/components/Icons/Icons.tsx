/**
 * Icons — lucide-react 기반 아이콘 모음
 * 기존 커스텀 SVG → lucide-react로 교체하여 일관성 있는 아이콘 사용
 */

import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Globe,
  Pencil,
  Trash2,
  Plus,
  PackageOpen,
  Cloud,
  X,
  Check,
  Search,
} from 'lucide-react';

// lucide-react 아이콘을 래핑해서 기존 Icons API 유지
export const Icons = {
  ChevronRight: (props: React.SVGProps<SVGSVGElement>) => (
    <ChevronRight size={14} {...(props as object)} />
  ),
  ChevronDown: (props: React.SVGProps<SVGSVGElement>) => (
    <ChevronDown size={14} {...(props as object)} />
  ),
  Folder: (props: React.SVGProps<SVGSVGElement>) => (
    <Folder size={15} {...(props as object)} />
  ),
  FolderOpen: (props: React.SVGProps<SVGSVGElement>) => (
    <FolderOpen size={15} {...(props as object)} />
  ),
  Globe: (props: React.SVGProps<SVGSVGElement>) => (
    <Globe size={13} {...(props as object)} />
  ),
  Edit: (props: React.SVGProps<SVGSVGElement>) => (
    <Pencil size={13} {...(props as object)} />
  ),
  Trash: (props: React.SVGProps<SVGSVGElement>) => (
    <Trash2 size={13} {...(props as object)} />
  ),
  Plus: (props: React.SVGProps<SVGSVGElement>) => (
    <Plus size={14} {...(props as object)} />
  ),
  EmptyBox: (props: React.SVGProps<SVGSVGElement>) => (
    <PackageOpen size={40} strokeWidth={1.2} {...(props as object)} />
  ),
  Cloud: (props: React.SVGProps<SVGSVGElement>) => (
    <Cloud size={16} {...(props as object)} />
  ),
  X: (props: React.SVGProps<SVGSVGElement>) => (
    <X size={16} {...(props as object)} />
  ),
  Check: (props: React.SVGProps<SVGSVGElement>) => (
    <Check size={14} {...(props as object)} />
  ),
  Search: (props: React.SVGProps<SVGSVGElement>) => (
    <Search size={14} {...(props as object)} />
  ),
};
