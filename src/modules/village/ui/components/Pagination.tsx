import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function usePagination<T>(items: T[], pageSize = 20) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = items.slice((safePage - 1) * pageSize, safePage * pageSize)
  return { page: safePage, setPage, totalPages, paged, total: items.length }
}

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize?: number
  onPage: (p: number) => void
}

export const Pagination = ({ page, totalPages, total, pageSize = 20, onPage }: PaginationProps) => {
  if (totalPages <= 1) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid #1e1e1e' }}>
      <span style={{ fontSize: 10, color: '#9a7a40', fontFamily: "'Orbitron', sans-serif" }}>
        {from}–{to} de {total}
      </span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: 2, background: 'transparent', border: '1px solid #1e1e1e', color: page === 1 ? '#3a2a0a' : '#9a7a40', cursor: page === 1 ? 'default' : 'pointer' }}
        >
          <ChevronLeft size={12} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => onPage(p)}
            style={{ padding: '4px 9px', borderRadius: 2, fontSize: 11, fontFamily: "'Orbitron', sans-serif", fontWeight: 700, cursor: 'pointer', background: p === page ? 'rgba(200,134,10,0.2)' : 'transparent', border: `1px solid ${p === page ? '#c8860a' : '#1e1e1e'}`, color: p === page ? '#c8860a' : '#9a7a40' }}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: 2, background: 'transparent', border: '1px solid #1e1e1e', color: page === totalPages ? '#3a2a0a' : '#9a7a40', cursor: page === totalPages ? 'default' : 'pointer' }}
        >
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  )
}
