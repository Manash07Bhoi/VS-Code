/**
 * CodeSense AI — Run and Debug panel.
 *
 * Truthful state: no execution runtime is configured, and running arbitrary
 * user code safely requires an isolated execution architecture that is
 * deliberately out of scope for this browser workbench. The panel explains
 * the required architecture instead of faking debug controls.
 */

function render(bodyEl) {
  bodyEl.innerHTML = '';

  const section = document.createElement('div');
  section.className = 'wb-info-section';
  section.innerHTML = `
    <h4>Run and Debug</h4>
    <p>No execution runtime is configured in this environment, so there is
    nothing to run or debug yet. This panel will not pretend otherwise — no
    fake breakpoints, no simulated consoles.</p>
    <h4>What running code here would require</h4>
    <p>Executing submitted code safely needs an isolated execution service,
    not the application server:</p>
    <ul>
      <li>A sandboxed runtime (container or VM per execution) — never the Express host process.</li>
      <li>Resource limits: CPU, memory, wall-clock timeout and output size caps.</li>
      <li>Network policy deny-by-default and a read-only, ephemeral filesystem.</li>
      <li>Authenticated, rate-limited execution API with full audit logging.</li>
      <li>Streaming output capture and guaranteed cleanup after every run.</li>
    </ul>
    <h4>What works today</h4>
    <p>The AI Review panel analyzes source without executing it, and editor
    diagnostics ( Problems panel ) surface real syntax issues for JavaScript
    and TypeScript via Monaco's language services.</p>
  `;
  bodyEl.appendChild(section);
}

export { render };
