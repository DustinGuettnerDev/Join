/**
 * Firebase configuration object containing the necessary credentials and settings to connect to the Firebase project.
 * This includes the API key, authentication domain, database URL, project ID, storage bucket, messaging sender ID, and app ID.
 */
const firebaseConfig = {
    apiKey: "AIzaSyDqKUIXrAGfDTsbymcVdJ2w5ATaApioOv8",
    authDomain: "join-5bd8d.firebaseapp.com",
    databaseURL: "https://join-5bd8d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "join-5bd8d",
    storageBucket: "join-5bd8d.firebasestorage.app",
    messagingSenderId: "404471964373",
    appId: "1:404471964373:web:584fe9ea95cd3476aab85c",
};
/**
 * Initializes the Firebase application with the provided configuration and sets up a reference to the Realtime Database.
 * This allows the application to interact with the Firebase services, such as authentication and database operations.
 */
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/**
 * Login function that retrieves the email and password from the input fields,
 * checks the "users" node in the Firebase Realtime Database for a matching email and password combination.
 * If a match is found, it sets the current user's name and email in local storage and loads additional data to local storage.
 * If no match is found, it calls the checkLoginResults function with a false value to indicate a failed login attempt.
 */
function loginUser() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    db.ref("users").once("value", function (snapshot) {
        let loginSuccess = false;
        snapshot.forEach(function (userSnapshot) {
            const userData = userSnapshot.val();
            if (userData.email == email && userData.password == password) {
                loginSuccess = true;
                localStorage.setItem("currentUserName", userData.name);
                localStorage.setItem("currentUserEmail", userData.email);
            }
        });
        if (loginSuccess) {
            loadDataToLocalStorage();
        } else {
            checkLoginResults(false);
        }
    });
}

/**
 * This function checks the result of the login attempt. If the login was successful (login Success is ture), it redirects to the summary page.
 * If the login was unsuccessful (login Success is false), it display an error massage using the SweetAlert library,
 * indicating that the email or password is incorrect.
 *
 */
function checkLoginResults(loginSuccess) {
    if (loginSuccess === true) {
        window.location.href = "summary.html";
    } else {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Email oder Passwort ist falsch!",
        });
    }
}

/**
 * This function loads data from the Firebase Realtime Database to the local storage of the browser.
 * It retrieves the data from the root of the database, extracts the "boards" and "contacs" data, and stores them in local storage as JSON strings.
 * After successfully loading the data, it calls the checkLoginResults function with a true value to indicate a successful login and data loading process.
 * This allows the application to have access to the necessary data for the user after logging in, and ensures that the user is redirected to the appropriate page.
 */
function loadDataToLocalStorage() {
    db.ref("/").once("value", function (snapshot) {
        const allData = snapshot.val();
        localStorage.setItem("boards", JSON.stringify(allData.boards));
        localStorage.setItem("contacs", JSON.stringify(allData.contacs));
        checkLoginResults(true);
    });
}

/**
 * This function allows users to log in as a guest by setting predefined values for the current user's name and email in local storage.
 */
function guestLogin() {
    localStorage.setItem("currentUserName", "Gast");
    localStorage.setItem("currentUserEmail", "Gast@Gast.com");
    loadDataToLocalStorage();
}

/**
 * This function handles the user registration process. It retrieves the password and password confirmation from the input fields, checks if they match, and if they do, it calls the checkIfUserExists function to verify if the user already exists in the database.
 * If the passwords do not match, it displays an error message using the SweetAlert library and exits the function.
 */
function registerUser() {
    const password = document.getElementById("password").value;
    const passwordconfirm = document.getElementById("passwordconfirm").value;
    if (!checkPrivacy()) return;
    if (password !== passwordconfirm) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Die Passwörter stimmen nicht überein!",
        });
        return;
    }
    checkIfUserExists();
}

/**
 * This function checks if the user has accepted the privacy policy by checking the stat of a checkbox with the id "privacy".
 * If the checkbox is not checked, it displays an error massage using SewwtAlert.
 */
function checkPrivacy() {
    const privacy = document.getElementById("privacy");
    if (!privacy.checked) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Bitte akzeptiere die Privacy Policy!",
        });
        return false;
    }
    return true;
}

/**
 * This function checks if a user with the provided email already exists in the Firebase Realtime Database under the "users" node.
 * It retrieves the email and password from the input fields, then queries the database for all users and checks if any of them have a matching email.
 * If a user with the same email is found, it displays an error message using the SweetAlert.
 * If no user with the same email is found, it calls the saveUser function to save the new user's data to the database.
 */
function checkIfUserExists() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value; // E-Mail und Passwort aus den Eingabefeldern holen
    db.ref("users").once("value", function (snapshot) {
        //Alle Benutzer unter "users" in der Datenbank abrufen
        let userExists = false; //Login standardmäßig auf false setzen
        snapshot.forEach(function (userSnapshot) {
            //snapshot durchläuft alle Benutzer
            const userData = userSnapshot.val(); //Daten in userData speichern
            if (userData.email === email) {
                //Überprüfen, ob E-Mail und Passwort übereinstimmen
                userExists = true; //Wenn ja, Login auf true setzen
            }
        });
        if (userExists === true) {
            //Wenn User bereits existiert, Fehlermeldung anzeigen sonst weiter zur function saveUser()
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Benutzer Existiert Bereits!",
            });
        } else {
            saveUser(name, email, password);
        }
    });
}

/**
 * This function saves a new user to the Realtime Database under the "users" node.
 * It takes the user's name, email, and password as parameters and pushes this data to the database.
 * If the user is successfully saved, it displays a success massage.
 * If there is an error during the saving process, it catches the error and displays an error massage.
 */
function saveUser(name, email, password) {
    db.ref("users")
        .push({
            name: name,
            email: email,
            password: password,
        })
        .then(function () {
            Swal.fire({
                title: "Registrierung Erfolgreich!",
                icon: "success",
                draggable: true,
            }).then(function () {
                window.location.href = "login.html";
            });
        })
        .catch(function (error) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Fehler bei der Registrierung! ",
            });
        });
}
