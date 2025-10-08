/*
function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

async function savePreferencesQuery(listOfPreferences) {
    let JSONQuery = JSON.stringify({
        "preferences" : listOfPreferences
    });
    console.log("Sending to server", JSONQuery);
    const savePreferencesUrl = window.savePreferencesUrl;
    const csrfToken = getCookie("csrftoken");
    try {
        let response = await fetch(savePreferencesUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSONQuery
        })
        if (!response.ok) {
            const text = await response.text();
            console.error("Server error:", response.status, text);
            return;
        }
        return await response.json();
    } catch(error) {
        console.log(error);
    }
    return null;
}

async function savePreferences() {
    const checkBoxes = Array.from(document.getElementsByTagName("input")).filter(element => {
        return element.type==="checkbox";
    })
    preferenceList = []
    checkBoxes.forEach(input => {
        if (input.checked) {
            preferenceList.push(input.value)
        }
    })
    const queryResponse = await savePreferencesQuery(preferenceList);
}
*/
const prefBox = document.getElementById("pref-message-box");
document.getElementById('box-picker').addEventListener('submit', async function(e) {
    prefBox.innerText = "";
    e.preventDefault();

    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;


    const checkedBoxes = Array.from(this.querySelectorAll('input[type=checkbox]:checked'))
                              .map(cb => cb.value);

    try {
        const response = await fetch(Window.setUserPrefURL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken,

            },
            body: JSON.stringify({ preferences: checkedBoxes }),
            credentials: "include"  // ensures cookies are sent
        });

        const data = await response.json();
        console.log("Server response:", data);

        if (data.success) {
            //alert("Preferences saved!");
            prefBox.style.color = "White";
            prefBox.innerText = 'Successfully saved preferences!'
        } else {
            prefBox.style.color = "Red";
            prefBox.innerText = 'Error saving preferences!'
            //alert("Error: " + data.error);
        }
    } catch (err) {
        console.error("Fetch error:", err);
    }
});