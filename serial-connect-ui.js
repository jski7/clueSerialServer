// Two-step connect: instruction modal → browser serial picker
(function () {
  function ensureSerialConnectModal() {
    if (document.getElementById('serial-connect-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'serial-connect-modal';
    modal.className = 'serial-connect-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'serial-connect-modal-title');
    modal.innerHTML =
      '<div class="serial-connect-modal__card">' +
        '<h2 id="serial-connect-modal-title" class="serial-connect-modal__title">connect to clue.</h2>' +
        '<p class="serial-connect-modal__text">' +
          'In the device selection window, select the <strong>Pico</strong> device and press <strong>Connect</strong>.' +
        '</p>' +
        '<div class="serial-connect-modal__actions">' +
          '<button type="button" class="button-36" id="serial-connect-modal-btn">Connect</button>' +
          '<button type="button" class="serial-connect-modal__cancel" id="serial-connect-modal-cancel">Cancel</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeSerialConnectModal();
    });

    document.getElementById('serial-connect-modal-cancel').addEventListener('click', closeSerialConnectModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeSerialConnectModal();
      }
    });
  }

  function closeSerialConnectModal() {
    const modal = document.getElementById('serial-connect-modal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.hidden = true;
  }

  function openSerialConnectModal(onConfirm) {
    ensureSerialConnectModal();
    const modal = document.getElementById('serial-connect-modal');
    const btn = document.getElementById('serial-connect-modal-btn');
    if (!modal || !btn) return;

    btn.onclick = () => {
      closeSerialConnectModal();
      if (typeof onConfirm === 'function') onConfirm();
    };

    modal.hidden = false;
    modal.classList.add('is-open');
    btn.focus();
  }

  window.openSerialConnectModal = openSerialConnectModal;
  window.closeSerialConnectModal = closeSerialConnectModal;
})();
