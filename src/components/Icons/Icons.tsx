/**
 * Icons — lucide-react 기반 아이콘 모음
 * 실제 사용되는 아이콘만 래핑
 */

import type { SVGProps } from 'react'
import { PackageOpen } from 'lucide-react'

const Icons = {
  EmptyBox: (props: SVGProps<SVGSVGElement>) => (
    <PackageOpen size={40} strokeWidth={1.2} {...(props as object)} />
  ),
}

export { Icons }
export default Icons
