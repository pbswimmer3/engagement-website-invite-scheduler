'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { INVITE_GROUPS, INVITE_GROUP_LABELS, normalizeInviteGroup, type InviteGroup } from '@/lib/email-template'

type Guest = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  invitation_group: string | null
  invite_group: string | null
  rsvp_status: string
  invite_sent_at: string | null
}

type Groups = Record<string, Guest[]>

const SECTION_KEYS: (InviteGroup | 'unassigned')[] = [...INVITE_GROUPS, 'unassigned']

const SECTION_LABELS: Record<InviteGroup | 'unassigned', string> = {
  ...INVITE_GROUP_LABELS,
  unassigned: 'Unassigned',
}

function groupSection(members: Guest[]): InviteGroup | 'unassigned' {
  const value = members.find((m) => m.invite_group)?.invite_group ?? null
  return normalizeInviteGroup(value) ?? 'unassigned'
}

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  attending: { label: 'Attending', cls: 'bg-green-50 text-green-700 border-green-200' },
  yes: { label: 'Attending', cls: 'bg-green-50 text-green-700 border-green-200' },
  declined: { label: 'Declined', cls: 'bg-red-50 text-red-700 border-red-200' },
  no: { label: 'Declined', cls: 'bg-red-50 text-red-700 border-red-200' },
  maybe: { label: 'Maybe', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  pending: { label: 'Pending', cls: 'bg-cream text-navy/50 border-gold/20' },
}

function statusInfo(status: string | null | undefined) {
  const key = (status ?? 'pending').toLowerCase()
  return STATUS_STYLES[key] ?? { label: status ?? 'Pending', cls: 'bg-cream text-navy/60 border-gold/20' }
}

function isAttending(s: string) {
  const k = s.toLowerCase()
  return k === 'attending' || k === 'yes'
}
function isDeclined(s: string) {
  const k = s.toLowerCase()
  return k === 'declined' || k === 'no'
}

export default function RsvpDashboard() {
  const [groups, setGroups] = useState<Groups>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'attending' | 'declined' | 'pending'>('all')

  const fetchGuests = async () => {
    setRefreshing(true)
    try {
      const res = await fetch(`/api/guests?t=${Date.now()}`, { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setGroups(data.groups)
    } catch {
      console.error('Failed to fetch guests')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchGuests()
  }, [])

  const allGuests = Object.values(groups).flat()
  const totalGuests = allGuests.length
  const attendingCount = allGuests.filter((g) => isAttending(g.rsvp_status)).length
  const declinedCount = allGuests.filter((g) => isDeclined(g.rsvp_status)).length
  const pendingCount = totalGuests - attendingCount - declinedCount
  const responseRate =
    totalGuests > 0 ? Math.round(((attendingCount + declinedCount) / totalGuests) * 100) : 0

  const groupEntries = Object.entries(groups).filter(([, members]) => {
    if (filter === 'all') return true
    if (filter === 'attending') return members.some((m) => isAttending(m.rsvp_status))
    if (filter === 'declined') return members.some((m) => isDeclined(m.rsvp_status))
    if (filter === 'pending')
      return members.some((m) => !isAttending(m.rsvp_status) && !isDeclined(m.rsvp_status))
    return true
  })

  // Bucket invitation groups by invite_group section
  const sections: Record<InviteGroup | 'unassigned', [string, Guest[]][]> = {
    praanya: [],
    biswas: [],
    jain: [],
    unassigned: [],
  }
  for (const entry of groupEntries) {
    sections[groupSection(entry[1])].push(entry)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-darkdenim mb-2">RSVP Dashboard</h1>
        <p className="text-navy/50 text-sm">Aanya &amp; Prad&apos;s Engagement Party</p>
      </div>

      {/* Nav + refresh */}
      <div className="flex justify-center items-center gap-3 mb-8 text-xs uppercase tracking-wider">
        <Link
          href="/"
          className="px-4 py-2 border border-gold/30 text-navy/60 rounded-lg hover:border-navy/40 transition-colors"
        >
          Invite Sender
        </Link>
        <span className="px-4 py-2 bg-navy text-white rounded-lg">RSVP Dashboard</span>
        <button
          onClick={fetchGuests}
          disabled={refreshing}
          className="px-4 py-2 border border-gold/30 text-navy/60 rounded-lg hover:border-navy/40 transition-colors disabled:opacity-40"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <p className="text-center text-navy/40">Loading RSVPs...</p>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`bg-white rounded-xl border px-4 py-4 text-left transition-colors ${
                filter === 'all' ? 'border-navy' : 'border-gold/20 hover:border-gold/40'
              }`}
            >
              <div className="text-2xl font-bold text-darkdenim">{totalGuests}</div>
              <div className="text-xs uppercase tracking-wider text-navy/50 mt-1">Total Guests</div>
            </button>
            <button
              onClick={() => setFilter('attending')}
              className={`bg-white rounded-xl border px-4 py-4 text-left transition-colors ${
                filter === 'attending' ? 'border-green-500' : 'border-gold/20 hover:border-gold/40'
              }`}
            >
              <div className="text-2xl font-bold text-green-600">{attendingCount}</div>
              <div className="text-xs uppercase tracking-wider text-navy/50 mt-1">Attending</div>
            </button>
            <button
              onClick={() => setFilter('declined')}
              className={`bg-white rounded-xl border px-4 py-4 text-left transition-colors ${
                filter === 'declined' ? 'border-red-500' : 'border-gold/20 hover:border-gold/40'
              }`}
            >
              <div className="text-2xl font-bold text-red-600">{declinedCount}</div>
              <div className="text-xs uppercase tracking-wider text-navy/50 mt-1">Declined</div>
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`bg-white rounded-xl border px-4 py-4 text-left transition-colors ${
                filter === 'pending' ? 'border-orange-500' : 'border-gold/20 hover:border-gold/40'
              }`}
            >
              <div className="text-2xl font-bold text-orange-500">{pendingCount}</div>
              <div className="text-xs uppercase tracking-wider text-navy/50 mt-1">Pending</div>
            </button>
          </div>

          {/* Response rate bar */}
          <div className="bg-white rounded-xl border border-gold/20 px-6 py-4 mb-8">
            <div className="flex justify-between items-center text-xs uppercase tracking-wider text-navy/50 mb-2">
              <span>Response Rate</span>
              <span className="font-bold text-darkdenim">{responseRate}%</span>
            </div>
            <div className="w-full h-2 bg-cream rounded-full overflow-hidden">
              <div
                className="h-full bg-navy transition-all"
                style={{ width: `${responseRate}%` }}
              />
            </div>
          </div>

          {/* Sections by invite_group */}
          {groupEntries.length === 0 ? (
            <p className="text-center text-navy/40 py-8">No RSVPs match this filter.</p>
          ) : (
            <div className="space-y-10">
              {SECTION_KEYS.map((section) => {
                const sectionGroups = sections[section]
                if (sectionGroups.length === 0) return null

                const sectionGuests = sectionGroups.flatMap(([, m]) => m)
                const sectionTotal = sectionGuests.length
                const sectionAttending = sectionGuests.filter((g) => isAttending(g.rsvp_status)).length
                const sectionDeclined = sectionGuests.filter((g) => isDeclined(g.rsvp_status)).length
                const sectionPending = sectionTotal - sectionAttending - sectionDeclined

                return (
                  <section key={section}>
                    {/* Section header */}
                    <div className="mb-4 border-b border-gold/30 pb-3">
                      <h2 className="text-xl font-bold text-darkdenim uppercase tracking-wider">
                        {SECTION_LABELS[section]}
                      </h2>
                      <p className="text-xs text-navy/50 mt-1">
                        {sectionTotal} guests &bull;{' '}
                        <span className="text-green-600">{sectionAttending} attending</span> &bull;{' '}
                        <span className="text-red-600">{sectionDeclined} declined</span> &bull;{' '}
                        <span className="text-orange-500">{sectionPending} pending</span>
                      </p>
                    </div>

                    {/* Group list */}
                    <div className="space-y-3">
                      {sectionGroups.map(([key, members]) => (
                        <div
                          key={key}
                          className="bg-white rounded-xl border border-gold/20 px-6 py-4"
                        >
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <h3 className="font-bold text-darkdenim truncate">
                              {members.map((m) => `${m.first_name} ${m.last_name}`).join(', ')}
                            </h3>
                            {members[0]?.invite_sent_at ? (
                              <span className="text-[10px] uppercase tracking-wider text-green-600 flex-shrink-0">
                                Invited
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase tracking-wider text-navy/30 flex-shrink-0">
                                Not Invited
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            {members.map((m) => {
                              const info = statusInfo(m.rsvp_status)
                              return (
                                <div
                                  key={m.id}
                                  className="flex items-center justify-between text-xs gap-3"
                                >
                                  <span className="text-navy/70 truncate">
                                    {m.first_name} {m.last_name}
                                    {m.email && (
                                      <span className="text-navy/30 ml-2">{m.email}</span>
                                    )}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 border rounded uppercase tracking-wider text-[10px] flex-shrink-0 ${info.cls}`}
                                  >
                                    {info.label}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
