// --- Config --- //
var pureAlert1Type = "alert-dark"; // Color
var pureAlert1Title = "MAINTENANCE MODE:"; // Title
var pureAlert1Icon = 'bi-hammer'; // Icon
var pureAlert1Desc = "As we continue to enhance this site, it will be temporarily unavailable for maintenance between 12 AM to 2 AM CDT on Saturday (4/11/2026) as we work to improve your experience. Thank you for your patience, and we apologize for any inconvenience caused."; // Description
var pureAlert1Link = ""; // Link URL (leave empty for no link)
var pureAlert1LinkDesc = ""; // Link Description
var pureAlert1Enabled = true; // Switch to enable/disable alert
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