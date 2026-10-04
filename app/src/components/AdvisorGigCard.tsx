import { formatAdvisorPrice, type AdvisorProfile } from '../lib/advisorMatching'

/**
 * The gig listing itself - thumbnail, name, price, specialties, bio. Shared
 * between the client-facing directory (FindAdvisorPage) and the advisor's
 * own "this is what clients see" preview (AdvisorDashboardPage), so the two
 * can never drift out of sync. Purely presentational - each page wraps it
 * with its own action area (an Edit button, or a message-request form).
 *
 * `compact` renders the condensed grid-tile version (truncated bio, capped
 * specialty chips, no licensing/pricing-note line) used for the 3-per-row
 * directory grid; the full version (default) is used in the detail modal a
 * client sees after clicking a tile, and in the advisor's own dashboard
 * preview.
 */
export default function AdvisorGigCard({
  profile,
  compact = false,
}: {
  profile: AdvisorProfile
  compact?: boolean
}) {
  const initials = profile.displayName
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const visibleSpecialties = compact ? profile.specialties.slice(0, 3) : profile.specialties
  const hiddenCount = compact ? profile.specialties.length - visibleSpecialties.length : 0

  return (
    <div className={compact ? 'flex flex-col items-center text-center gap-3' : 'flex items-start gap-4'}>
      <div
        className={`rounded-full overflow-hidden border border-[rgba(56,189,248,0.4)] bg-lp-chalk-dim flex items-center justify-center flex-shrink-0 ${
          compact ? 'w-16 h-16' : 'w-16 h-16'
        }`}
      >
        {profile.photoUrl ? (
          <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-base font-normal text-lp-slate">{initials || '?'}</span>
        )}
      </div>

      <div className={compact ? 'flex-1 min-w-0 w-full' : 'flex-1 min-w-0'}>
        <div className={compact ? 'flex flex-col items-center gap-1' : 'flex items-start justify-between gap-3'}>
          <div className={compact ? 'text-center' : ''}>
            <div className="font-normal text-lp-graphite text-lg">{profile.displayName || 'Unnamed advisor'}</div>
            {profile.credential && (
              <div className="text-xs text-[var(--color-lp-cyan)] font-mono mt-0.5">{profile.credential}</div>
            )}
          </div>
          <div className={compact ? 'text-center' : 'text-right flex-shrink-0'}>
            <div className="text-sm font-normal text-lp-graphite whitespace-nowrap">{formatAdvisorPrice(profile)}</div>
            {profile.yearsExperience > 0 && (
              <div className="text-[11px] text-lp-slate font-mono mt-0.5">{profile.yearsExperience}+ yrs</div>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className={`text-sm text-lp-slate leading-relaxed mt-2 ${compact ? 'line-clamp-2' : ''}`}>
            {profile.bio}
          </p>
        )}

        {visibleSpecialties.length > 0 && (
          <div className={`flex flex-wrap gap-1.5 mt-3 ${compact ? 'justify-center' : ''}`}>
            {visibleSpecialties.map((s) => (
              <span key={s} className="gig-chip text-[11px] px-2.5 py-1 rounded-full">
                {s}
              </span>
            ))}
            {hiddenCount > 0 && (
              <span className="text-[11px] px-2.5 py-1 rounded-full border border-lp-line-strong text-lp-slate">
                +{hiddenCount} more
              </span>
            )}
          </div>
        )}

        {!compact && (profile.statesLicensed || profile.pricingNote) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-lp-slate mt-3">
            {profile.statesLicensed && <span>Licensed: {profile.statesLicensed}</span>}
            {profile.pricingNote && <span>{profile.pricingNote}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
