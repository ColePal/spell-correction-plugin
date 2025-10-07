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
    savePreferencesQuery(preferenceList);
}