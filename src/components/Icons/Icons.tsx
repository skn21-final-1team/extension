/**
 * Icons — lucide-react 기반 아이콘 모음
 * 실제 사용되는 아이콘만 래핑
 */

import { PackageOpen } from 'lucide-react';

export const Icons = {
  EmptyBox: (props: React.SVGProps<SVGSVGElement>) => (
    <PackageOpen size={40} strokeWidth={1.2} {...(props as object)} />
  ),
};
