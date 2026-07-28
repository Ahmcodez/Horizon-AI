/**
 * Horizon embeddable claiming-age widget
 * -----------------------------------------
 * Drop this on any page:
 *
 *   <div id="horizon-widget" data-endpoint="https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/embedCalculate"></div>
 *   <script src="https://your-horizon-domain.com/embed.js" defer></script>
 *
 * No API key required - this calls a public, unauthenticated,
 * calculation-only endpoint. No user data is stored or transmitted
 * beyond the two numbers the visitor enters.
 */
(function () {
  function init(container) {
    const endpoint = container.getAttribute('data-endpoint');
    if (!endpoint) {
      container.innerHTML = '<p style="font-family:sans-serif;color:#a33;">Horizon widget: missing data-endpoint attribute.</p>';
      return;
    }

    container.innerHTML = `
      <div style="font-family:-apple-system,sans-serif;max-width:420px;border:1px solid #e5e0d5;border-radius:16px;padding:24px;background:#faf7f2;">
        <div style="font-size:12px;letter-spacing:0.05em;text-transform:uppercase;color:#c97f1e;font-weight:600;margin-bottom:12px;">Social Security Estimate</div>
        <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Birth year</label>
        <input id="hz-birthyear" type="number" value="1965" min="1930" max="2010"
          style="width:100%;padding:10px 12px;border:1px solid #ddd6c5;border-radius:8px;margin-bottom:14px;font-family:monospace;box-sizing:border-box;">
        <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Benefit at full retirement age ($/mo)</label>
        <input id="hz-pia" type="number" value="2000" min="0" max="10000"
          style="width:100%;padding:10px 12px;border:1px solid #ddd6c5;border-radius:8px;margin-bottom:16px;font-family:monospace;box-sizing:border-box;">
        <button id="hz-calc" style="width:100%;padding:12px;border:none;border-radius:100px;background:#e8a33d;color:#0e0f12;font-weight:700;cursor:pointer;">
          Calculate
        </button>
        <div id="hz-result" style="margin-top:18px;"></div>
        <div style="margin-top:14px;font-size:10px;color:#888;">Informational only, not financial advice. Powered by Horizon.</div>
      </div>
    `;

    const button = container.querySelector('#hz-calc');
    const resultEl = container.querySelector('#hz-result');

    button.addEventListener('click', async function () {
      const birthYear = Number(container.querySelector('#hz-birthyear').value);
      const pia = Number(container.querySelector('#hz-pia').value);
      button.textContent = 'Calculating…';
      button.disabled = true;

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ birthYear, pia }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');

        const rows = data.comparison
          .map(
            (r) =>
              `<div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid #eee;font-family:monospace;font-size:13px;">
                <span>Age ${r.age}${r.age === data.fullRetirementAge.years ? ' (FRA)' : ''}</span>
                <span>$${r.monthlyBenefit.toLocaleString()}/mo</span>
              </div>`
          )
          .join('');
        resultEl.innerHTML = rows;
      } catch (err) {
        resultEl.innerHTML = '<p style="color:#a33;font-size:13px;">Could not calculate — please try again.</p>';
      } finally {
        button.textContent = 'Calculate';
        button.disabled = false;
      }
    });
  }

  document.querySelectorAll('[id^="horizon-widget"]').forEach(init);
})();
