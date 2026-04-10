'use client'

import { useEffect, useState } from 'react'

type Guest = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  invitation_group: string | null
  rsvp_status: string
  invite_sent_at: string | null
}

type Groups = Record<string, Guest[]>

export default function Dashboard() {
  const [groups, setGroups] = useState<Groups>({})
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [sendingAll, setSendingAll] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [flash, setFlash] = useState<{ key: string; ok: boolean; msg: string } | null>(null)

  const fetchGuests = async () => {
    try {
      const res = await fetch(`/api/guests?t=${Date.now()}`, { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setGroups(data.groups)
    } catch {
      console.error('Failed to fetch guests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGuests() }, [])

  const sendInvite = async (groupKey: string, members: Guest[]) => {
    setSending(groupKey)
    setFlash(null)
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupKey,
          memberIds: members.map((m) => m.id),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setFlash({ key: groupKey, ok: true, msg: `Sent to ${data.sentTo.join(', ')}` })
      fetchGuests() // refresh sent status
    } catch (err) {
      setFlash({ key: groupKey, ok: false, msg: err instanceof Error ? err.message : 'Send failed' })
    } finally {
      setSending(null)
    }
  }

  const sendAll = async () => {
    setSendingAll(true)
    const unsent = Object.entries(groups).filter(
      ([, members]) => !members[0]?.invite_sent_at && members.some((m) => m.email)
    )
    for (const [key, members] of unsent) {
      await sendInvite(key, members)
    }
    setSendingAll(false)
  }

  const handlePreview = async (groupKey: string, members: Guest[]) => {
    if (preview === groupKey) {
      setPreview(null)
      return
    }
    // Fetch the preview HTML from our template (client-side render)
    try {
      const res = await fetch(`/api/preview?ids=${members.map((m) => m.id).join(',')}`)
      const data = await res.json()
      setPreviewHtml(data.html)
      setPreview(groupKey)
    } catch {
      setPreviewHtml('<p>Failed to load preview</p>')
      setPreview(groupKey)
    }
  }

  const groupEntries = Object.entries(groups)
  const totalGuests = groupEntries.reduce((n, [, m]) => n + m.length, 0)
  const sentGroups = groupEntries.filter(([, m]) => m[0]?.invite_sent_at).length
  const unsentGroups = groupEntries.filter(
    ([, m]) => !m[0]?.invite_sent_at && m.some((g) => g.email)
  ).length

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-darkdenim mb-2">Invite Sender</h1>
        <p className="text-navy/50 text-sm">Aanya &amp; Prad&apos;s Engagement Party</p>
      </div>

      {loading ? (
        <p className="text-center text-navy/40">Loading guests...</p>
      ) : (
        <>
          {/* Stats bar */}
          <div className="flex justify-between items-center bg-white rounded-xl border border-gold/20 px-6 py-4 mb-8 text-sm">
            <div>
              <span className="font-bold text-darkdenim">{totalGuests}</span>{' '}
              <span className="text-navy/50">guests</span>
              <span className="mx-2 text-gold">|</span>
              <span className="font-bold text-darkdenim">{groupEntries.length}</span>{' '}
              <span className="text-navy/50">invitations</span>
              <span className="mx-2 text-gold">|</span>
              <span className="text-green-600 font-bold">{sentGroups}</span>{' '}
              <span className="text-navy/50">sent</span>
              <span className="mx-2 text-gold">|</span>
              <span className="text-orange-500 font-bold">{unsentGroups}</span>{' '}
              <span className="text-navy/50">unsent</span>
            </div>
            <button
              onClick={sendAll}
              disabled={sendingAll || unsentGroups === 0}
              className="px-5 py-2 bg-navy text-white text-xs uppercase tracking-wider rounded-lg hover:bg-darkdenim transition-colors disabled:opacity-40"
            >
              {sendingAll ? 'Sending...' : `Send All Unsent (${unsentGroups})`}
            </button>
          </div>

          {/* Group cards */}
          <div className="space-y-4">
            {groupEntries.map(([key, members]) => {
              const emails = members.filter((m) => m.email).map((m) => m.email!)
              const sent = !!members[0]?.invite_sent_at
              const isSending = sending === key

              return (
                <div
                  key={key}
                  className={`bg-white rounded-xl border px-6 py-5 transition-colors ${
                    sent ? 'border-green-200' : 'border-gold/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Group name */}
                      <div className="flex items-center gap-2 mb-2">
                        {sent && <span className="text-green-500 text-sm">&#10003;</span>}
                        <h3 className="font-bold text-darkdenim truncate">
                          {members.map((m) => `${m.first_name} ${m.last_name}`).join(', ')}
                        </h3>
                      </div>

                      {/* Emails */}
                      <div className="text-xs text-navy/40 space-x-2">
                        {emails.length > 0 ? (
                          emails.map((e) => (
                            <span key={e} className="inline-block bg-cream rounded px-2 py-0.5">
                              {e}
                            </span>
                          ))
                        ) : (
                          <span className="text-red-400">No email addresses</span>
                        )}
                      </div>

                      {/* Sent timestamp */}
                      {sent && (
                        <p className="text-xs text-green-500 mt-1">
                          Sent {new Date(members[0].invite_sent_at!).toLocaleString()}
                        </p>
                      )}

                      {/* Flash message */}
                      {flash?.key === key && (
                        <p className={`text-xs mt-1 ${flash.ok ? 'text-green-600' : 'text-red-500'}`}>
                          {flash.msg}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handlePreview(key, members)}
                        className="px-3 py-1.5 border border-gold/30 text-navy/60 text-xs uppercase tracking-wider rounded-lg hover:border-navy/40 transition-colors"
                      >
                        {preview === key ? 'Hide' : 'Preview'}
                      </button>
                      <button
                        onClick={() => sendInvite(key, members)}
                        disabled={isSending || emails.length === 0}
                        className={`px-4 py-1.5 text-xs uppercase tracking-wider rounded-lg transition-colors disabled:opacity-40 ${
                          sent
                            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                            : 'bg-navy text-white hover:bg-darkdenim'
                        }`}
                      >
                        {isSending ? '...' : sent ? 'Resend' : 'Send'}
                      </button>
                    </div>
                  </div>

                  {/* Email preview */}
                  {preview === key && (
                    <div className="mt-4 border-t border-gold/10 pt-4">
                      <div
                        className="rounded-lg overflow-hidden border border-gold/10"
                        style={{ maxHeight: '500px', overflowY: 'auto' }}
                      >
                        <iframe
                          srcDoc={previewHtml}
                          title="Email Preview"
                          className="w-full border-0"
                          style={{ height: '520px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
