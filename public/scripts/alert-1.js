// --- Config --- //
// Values come from public/data/site-settings.json (editable in the CMS at /admin),
// injected as window.__SITE_ALERT__ by Layout.astro. The literals below are only a
// fallback in case that injection is ever missing.
var siteAlertConfig = window.__SITE_ALERT__ || {};
var pureAlert1Type = siteAlertConfig.type || "alert-dark"; // Color
var pureAlert1Title = siteAlertConfig.title || ""; // Title
var pureAlert1Icon = siteAlertConfig.icon || "bi-megaphone-fill"; // Icon
var pureAlert1Desc = siteAlertConfig.description || ""; // Description
var pureAlert1Link = siteAlertConfig.linkUrl || ""; // Link URL (leave empty for no link)
var pureAlert1LinkDesc = siteAlertConfig.linkText || ""; // Link Description
var pureAlert1Enabled = Boolean(siteAlertConfig.enabled); // Switch to enable/disable alert
// ---        --- //

function setAlert1Cookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000 * 4.28571428571));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getAlert1Cookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function eraseAlert1Cookie(name) {
  document.cookie = name + '=; Max-Age=-99999999;';
}

$(document).ready(function () {
  if (pureAlert1Enabled && window.location.pathname === "/" && !getAlert1Cookie('pureAlert1Dismiss')) {
    var index = $('#index');
    var alert1Container = $('<div class="alert-container"></div>');
    
    var linkHTML = '';
    if (pureAlert1Link && pureAlert1LinkDesc) {
      linkHTML = ' <a class="icon-link icon-link-hover" href="' + pureAlert1Link + '">' + pureAlert1LinkDesc + '<i class="bi bi-arrow-right h-100"></i></a>';
    }
    
    alert1Container.html('<div class="alert ' + pureAlert1Type + ' alert-dismissible fade show mb-0 d-flex gap-2 custom-alert" role="alert"> <i class="bi ' + pureAlert1Icon + ' h-100"></i><div><strong>' + pureAlert1Title + '</strong> ' + pureAlert1Desc + linkHTML + '</div><button onclick="pureAlert1Dismiss();" type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button> </div>');
    
    index.prepend(alert1Container);
  }
});

function pureAlert1Dismiss() {
  setAlert1Cookie('pureAlert1Dismiss', '1', 7);
}