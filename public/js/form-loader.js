// function setupLoadingButton(formId, buttonId, loadingText) {
//     const form = document.getElementById(formId);
//     const button = document.getElementById(buttonId);

//     if (!form || !button) return;

//     form.addEventListener("submit", () => {
//         button.disabled = true;
//         button.textContent = loadingText;
//         console.log(`Button with ID "${buttonId}" is now disabled and shows loading text: "${loadingText}"`);
//     });

//     form.addEventListener("submit", () => {

//     button.disabled = true;

//     button.innerHTML = `
//         <span class="spinner"></span>
//         Creating Account...
//     `;

// });
// }
function setupLoadingButton(formId, buttonId, loadingText) {

    const form = document.getElementById(formId);
    const button = document.getElementById(buttonId);

    console.log(form);
    console.log(button);

    if (!form || !button) return;

    form.addEventListener("submit", () => {
        button.disabled = true;
        button.innerHTML = `
            <span class="spinner"></span>
            ${loadingText}
        `;
    });

}