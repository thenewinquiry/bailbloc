 function createCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

console.log("starting preview");
console.log("yay" === null);

if (readCookie("bbprviewcookie") === "yay") {
    $('.container').show();
} else {
    $('body').append( 
        "<div class='preview-form'><div class='preview-instructions'><p class='preview-title'>PROTECTED PAGE</p><p></p></div><form id='preview-form' action='#' method='post'><input id='preview-password' type='password' name='password' placeholder='passphrase'autofocus/><input type='submit' class='preview-submit' value='DECRYPT'/></form></div>"
    );
    document.getElementById('preview-form').addEventListener('submit', function(e) {
        e.preventDefault();
        if (document.getElementById('preview-password').value == "ABOLISH!") {
            $(".preview-form").hide();
            $('.container').show();
            createCookie('bbprviewcookie', 'yay', 1);
        } else {
            alert("Sorry, incorrect password!");
        }
    });
/*
    "<div class='staticrypt-form'><div class='staticrypt-instructions'><p class='staticrypt-title'>PROTECTED PAGE</p><p></p></div><hr class='staticrypt-hr'><form id='staticrypt-form' action='#' method='post'><input id='staticrypt-password' type='password' name='password' placeholder='passphrase'autofocus/><input type='submit' class='staticrypt-decrypt-button' value='DECRYPT'/></form></div>";*/
    //createCookie("bbprviewcookie",'hooray',1);
}

