document.addEventListener('DOMContentLoaded', function() {
    const pinForm = document.getElementById('pinForm');

    pinForm.addEventListener('input', function(event) {
        const input = event.target;

        // Automatically move to the next textbox when the current one is filled
        if (input.value.length === input.maxLength) {
            const nextInput = input.nextElementSibling;

            if (nextInput) {
                nextInput.focus();
            }
        }
    });

    pinForm.addEventListener('submit', function(event) {
        event.preventDefault();

        // Validate and process the PIN here
        const digit1 = document.getElementById('digit1').value;
        const digit2 = document.getElementById('digit2').value;
        const digit3 = document.getElementById('digit3').value;
        const digit4 = document.getElementById('digit4').value;

        const enteredPIN = `${digit1}${digit2}${digit3}${digit4}`;

        // Fetch to check the PIN against the Judge table
        fetch('/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pin: enteredPIN }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    //create session
                    sessionStorage.setItem('judgeNo', data.judgeNo);
                    sessionStorage.setItem('judgeTrueNumber', data.number);

                    // PIN is correct, redirect to /index or your desired page
                    window.location.href = '/';
                } else {
                    // Display an error alert for incorrect PIN
                    alert('Error: Incorrect PIN. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });

    pinForm.addEventListener('input', function(event) {
        const input = event.target;


        // Automatically move to the next textbox when the current one is filled
        if (input.value.length === input.maxLength) {
            const parentDiv = input.parentElement;
            if (parentDiv.nextElementSibling) {
                const nextInput = parentDiv.nextElementSibling.querySelector('input');

                if (nextInput) {
                    nextInput.focus();
                }
            }

        }
    });
});