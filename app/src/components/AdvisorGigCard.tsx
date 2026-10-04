import { formatAdvisorPrice, type AdvisorProfile } from '../lib/advisorMatching'

/**
 * The gig listing itself - thumbnail, name, price, specialties, bio. Shared
 * between the client-facing directory (FindAdvisorPage) and the advisor's
 * own "this is what clients see" preview (AdvisorDashboardPage), so the two
 * can never drift out of sync. Purely presentational - each page wraps it
 * with its own action area (an Edit button, or a message-request form).
 */
export default function AdvisorGigCard({ profile }: { profile: AdvisorProfile }) {
  const initials = profile.displayName
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex items-start gap-4">
      <div className="w-16 h-16 rounded-full overflow-hidden border border-lp-line-strong bg-lp-chalk-dim flex items-center justify-center flex-shrink-0">
        {profile.photoUrl ? (
          <img src={profile.photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-base font-normal text-lp-slate">{initials || '?'}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-normal text-lp-graphite text-lg">{profile.displayName || 'Unnamed advisor'}</div>
            {profile.credential && (
              <div className="text-xs text-[var(--color-lp-cyan)] font-mono mt-0.5">{profile.credential}</div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-normal text-lp-graphite whitespace-nowrap">{formatAdvisorPrice(profile)}</div>
            {profile.yearsExperience > 0 && (
              <div className="text-[11px] text-lp-slate font-mono mt-0.5">{profile.yearsExperience}+ yrs</div>
            )}
          </div>
        </div>

        {profile.bio && <p className="text-sm text-lp-slate leading-relaxed mt-2">{profile.bio}</p>}

        {profile.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.specialties.map((s) => (
              <span
                key={s}
                className="text-[11px] px-2.5 py-1 rounded-full border border-lp-line-strong text-lp-slate"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {(profile.statesLicensed || profile.pricingNote) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-lp-slate mt-3">
            {profile.statesLicensed && <span>Licensed: {profile.statesLicensed}</span>}
            {profile.pricingNote && <span>{profile.pricingNote}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
