function init() { // Initialize the editUser view using user information stored in original-campaign
    var currentUser = JSON.parse(document.getElementById('original-user').value); // Get the campaign information object

    document.getElementById('inputUsername').value = currentUser.username; // Load start and end dates
    document.getElementById('inputPassword').value = currentUser.password;
    document.getElementById('inputEmail').value = currentUser.email;
    document.getElementById('inputFirstName').value = currentUser.firstName;
    document.getElementById('inputLastName').value = currentUser.lastName;
    
    if (currentUser.canvasser == true) {
        document.getElementById("inlineCheckbox1").checked = true;
    }
    if (currentUser.campaignManager == true) {
        document.getElementById("inlineCheckbox2").checked = true;
    }
    if (currentUser.sysAdmin == true) {
        document.getElementById("inlineCheckbox3").checked = true;
    }
}

init();