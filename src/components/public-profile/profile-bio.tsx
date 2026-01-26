/**
 * Profile Bio Component
 * 
 * Bio section with markdown support, specialties, years of experience, and awards
 * 
 * Requirements:
 * - 2.3: Display bio with markdown support
 * - 2.7: Display specialties as tags (max 5)
 * - 2.8: Display years of experience
 * - 2.9: Display awards (max 3)
 * - 11.1: Display responsive on mobile, tablet, and desktop
 */

interface ProfileBioProps {
  bio?: string;
  specialties?: string[];
  yearsOfExperience?: number;
  awards?: string[];
}

export function ProfileBio({
  bio,
  specialties,
  yearsOfExperience,
  awards,
}: ProfileBioProps) {
  // If no content to display, return null
  if (!bio && !specialties && !yearsOfExperience && !awards) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Bio */}
      {bio && (
        <section 
          className="bg-white rounded-2xl p-5 sm:p-6 md:p-8 shadow-sm border border-slate-200 profile-card"
          aria-labelledby="bio-heading"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl text-white shadow-lg shadow-blue-500/30" aria-hidden="true">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 id="bio-heading" className="text-xl sm:text-2xl font-bold text-slate-900 profile-text-primary">À propos</h2>
          </div>
          <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base profile-text-secondary">
            {bio}
          </div>
        </section>
      )}

      {/* Specialties and Experience */}
      {(specialties || yearsOfExperience || awards) && (
        <section 
          className="bg-white rounded-2xl p-5 sm:p-6 md:p-8 shadow-sm border border-slate-200 profile-card"
          aria-labelledby="expertise-heading"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white shadow-lg shadow-purple-500/30" aria-hidden="true">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h2 id="expertise-heading" className="text-xl sm:text-2xl font-bold text-slate-900 profile-text-primary">Expertise</h2>
          </div>

          <div className="space-y-5 sm:space-y-6">
            {specialties && specialties.length > 0 && (
              <div>
                <h3 id="specialties-heading" className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2.5 sm:mb-3 profile-text-muted">
                  Spécialités
                </h3>
                <div className="flex flex-wrap gap-2" role="list" aria-labelledby="specialties-heading">
                  {specialties.map((specialty, index) => (
                    <span
                      key={index}
                      role="listitem"
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs sm:text-sm font-semibold shadow-sm profile-badge"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {yearsOfExperience !== undefined && yearsOfExperience !== null && (
              <div>
                <h3 id="experience-heading" className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2.5 sm:mb-3 profile-text-muted">
                  Expérience
                </h3>
                <div className="inline-flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl profile-badge" aria-labelledby="experience-heading">
                  <div className="p-1.5 sm:p-2 bg-emerald-500 rounded-lg" aria-hidden="true">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-emerald-700" aria-label={`${yearsOfExperience} années d'expérience`}>
                    {yearsOfExperience} ans
                  </span>
                </div>
              </div>
            )}

            {awards && awards.length > 0 && (
              <div>
                <h3 id="awards-heading" className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2.5 sm:mb-3 profile-text-muted">
                  Récompenses
                </h3>
                <ul className="space-y-2.5 sm:space-y-3" aria-labelledby="awards-heading">
                  {awards.map((award, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl profile-badge"
                    >
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-slate-900 font-semibold text-sm sm:text-base profile-text-primary">{award}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
