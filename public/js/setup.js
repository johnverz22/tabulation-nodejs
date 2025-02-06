document.addEventListener('DOMContentLoaded', function() {
    const segmentForm = document.getElementById('segmentForm');
    const segmentsTable = document.getElementById('segmentsTable');
    const criteriaForm = document.getElementById('criteriaForm');

    fetchSegments();

    segmentForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = {
            name: document.getElementById('segmentName').value
        };
        console.log(formData);
        fetch('/segment-save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)

            })
            .then(response => response.json())
            .then(data => {
                segmentForm.reset();
                fetchSegments();
                fetchSegmentsForSelect();
            })
            .catch(error => {
                console.error('Error adding segment:', error);
            });
    });


    // Function to fetch and update segments table
    function fetchSegments() {

        fetch('/get-segments') // Assuming you have an endpoint to fetch segments
            .then(response => response.json())
            .then(data => {
                // Clear existing rows
                segmentsTable.querySelector('tbody').innerHTML = '';

                // Add new rows based on the fetched data
                data.forEach(segment => {
                    const row = segmentsTable.querySelector('tbody').insertRow();
                    row.insertCell(0).textContent = segment.name;

                    // Add delete button with onclick event
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.classList.add('btn', 'btn-danger', 'btn-sm');
                    deleteButton.onclick = function() {
                        deleteSegment(segment.id);
                    };
                    row.insertCell(1).appendChild(deleteButton);
                });
            })
            .catch(error => {
                console.error('Error fetching segments:', error);
            });
    }

    // Function to delete a segment
    function deleteSegment(segmentId) {
        const confirmDelete = confirm('Are you sure you want to delete this segment?');

        if (confirmDelete) {
            fetch(`/segment-delete/${segmentId}`, {
                    method: 'DELETE',
                })
                .then(response => response.json())
                .then(data => {
                    // Handle the response (e.g., update the table with the remaining segments)
                    console.log('Segment deleted:', data);
                    // Call the function to update the table
                    fetchSegments();
                    fetchSegmentsForSelect();
                })
                .catch(error => {
                    console.error('Error deleting segment:', error);
                });
        }
    }

    // Function to update a segment
    function updateSegment(segmentId, segmentName) {
        const updatedName = prompt('Enter the updated segment name:', segmentName);

        if (updatedName !== null) {
            fetch('/segment-update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ segmentId, updatedName }),
                })
                .then(response => response.json())
                .then(data => {
                    // Handle the response (e.g., update the table with the updated segment)
                    console.log('Segment updated:', data);
                    // Call the function to update the table
                    fetchSegments();
                })
                .catch(error => {
                    console.error('Error updating segment:', error);
                });
        }
    }


    // Function to fetch segments and populate the segment select options
    function fetchSegmentsForSelect() {
        fetch('/get-segments')
            .then(response => response.json())
            .then(data => {
                // Clear existing options
                segmentSelect.innerHTML = '';

                // Add new options based on the fetched data
                data.forEach(segment => {
                    const option = document.createElement('option');
                    option.value = segment.id;
                    option.textContent = segment.name;
                    segmentSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error fetching segments:', error);
            });
    }

    fetchSegmentsForSelect(); //populate select

    //submit criteria
    criteriaForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = {
            segment_id: document.getElementById('segmentSelect').value,
            name: document.getElementById('criteriaName').value,
            percent: document.getElementById('criteriaPercent').value

        };

        fetch('/criteria-save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)

            })
            .then(response => response.json())
            .then(data => {
                criteriaForm.criteriaName.value="";
                criteriaForm.criteriaPercent.value="";
                fetchCriteria();
            })
            .catch(error => {
                console.error('Error adding segment:', error);
            });
    });


    // Function to fetch and populate criteria tables
    function fetchCriteria() {
        fetch('/get-criteria')
            .then(response => response.json())
            .then(data => {
                const criteriaTableDiv = document.getElementById('criteriaTable');
                criteriaTableDiv.innerHTML = '';

                // Create a table
                const table = document.createElement('table');
                table.classList.add('table', 'table-bordered', 'mt-4');

                // Create table body
                const tableBody = document.createElement('tbody');

                // Create a row for each segment title
                Object.entries(data).forEach(([segmentId, criteriaList]) => {
                    const titleRow = tableBody.insertRow();

                    // Add a single cell for the segment title with merged cells
                    const titleCell = titleRow.insertCell();
                    titleCell.colSpan = 3; // Assuming you have three columns (criteria, percent, delete button)
                    titleCell.innerHTML = `<strong>${segmentId}</strong>`;
                    titleCell.classList.add('table-info');

                    // Create rows for each criteria in the segment
                    criteriaList.forEach(criteria => {
                        const row = tableBody.insertRow();

                        // Add cells for criteria, percent, and delete button
                        const cell1 = row.insertCell();
                        cell1.textContent = criteria.c_name;

                        const cell2 = row.insertCell();
                        cell2.textContent = `${criteria.percent}%`;

                        const cell3 = row.insertCell();

                        // Add delete button with onclick event
                        const deleteButton = document.createElement('button');
                        deleteButton.textContent = 'Delete';
                        deleteButton.classList.add('btn', 'btn-danger', 'btn-sm');
                        deleteButton.onclick = function() {
                            deleteCriteria(criteria.id);
                        };
                        cell3.appendChild(deleteButton);
                    });
                });

                table.appendChild(tableBody);

                // Append the table to the criteriaTableDiv
                criteriaTableDiv.appendChild(table);
            })
            .catch(error => {
                console.error('Error fetching criteria:', error);
            });
    }

    fetchCriteria();

    // Function to delete a segment
    function deleteCriteria(criteriaId) {
        const confirmDelete = confirm('Are you sure you want to delete this criteria?');

        if (confirmDelete) {
            fetch(`/criteria-delete/${criteriaId}`, {
                    method: 'DELETE',
                })
                .then(response => response.json())
                .then(data => {
                    // Handle the response (e.g., update the table with the remaining segments)
                    console.log('Criteria deleted:', data);
                    // Call the function to update the table
                    fetchCriteria();
                })
                .catch(error => {
                    console.error('Error deleting segment:', error);
                });
        }
    }


    const judgesForm = document.getElementById('judgesForm');

    judgesForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const numberOfJudges = document.getElementById('numberOfJudges').value;

        fetch('/judges-generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ numberOfJudges }),
            })
            .then(response => response.json())
            .then(data => {
                fetchJudges();
                judgesForm.reset();
            })
            .catch(error => {
                console.error('Error generating judges:', error);
            });
    });

    const judgesTableBody = document.getElementById('judgesTableBody');

    function fetchJudges() {
        fetch('/get-judges')
            .then(response => response.json())
            .then(data => {
                // Clear existing table rows
                judgesTableBody.innerHTML = '';

                // Populate the table with fetched judges
                data.forEach(judge => {
                    const row = judgesTableBody.insertRow();
                    const cell1 = row.insertCell(0);
                    const cell2 = row.insertCell(1);


                    cell1.textContent = judge.number;
                    cell2.textContent = judge.pin;

                    const cell3 = row.insertCell(2);

                    // Add delete button with onclick event
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.classList.add('btn', 'btn-danger', 'btn-sm');
                    deleteButton.onclick = function() {
                        deleteJudge(judge.id);


                    };
                    cell3.appendChild(deleteButton);
                });
            })
            .catch(error => {
                console.error('Error fetching judges:', error);
            });
    }

    fetchJudges();

    // Function to delete a segment
    function deleteJudge(judgeId) {
        const confirmDelete = confirm('Are you sure you want to delete this judge?');

        if (confirmDelete) {
            fetch(`/judge-delete/${judgeId}`, {
                    method: 'DELETE',
                })
                .then(response => response.json())
                .then(data => {
                    // Handle the response (e.g., update the table with the remaining segments)
                    console.log('Judge deleted:', data);
                    // Call the function to update the table
                    fetchJudges();
                })
                .catch(error => {
                    console.error('Error deleting segment:', error);
                });
        }
    }


    const generalForm = document.getElementById('generalForm');
    const titleInput = document.getElementById('title');
    const candidatesCountInput = document.getElementById('candidatesCount');
    const submitButton = document.querySelector('#generalForm button[type="submit"]');

    let isEditMode = false;

    function toggleEditMode() {
        isEditMode = !isEditMode;

        if (isEditMode) {
            submitButton.textContent = 'Save';
            titleInput.removeAttribute('readonly');
            candidatesCountInput.removeAttribute('readonly');
        } else {
            submitButton.textContent = 'Edit';
            titleInput.setAttribute('readonly', true);
            candidatesCountInput.setAttribute('readonly', true);
            // Save changes (you can call a function here to save the changes)

            const data = {
                title: titleInput.value,
                candidatesCount: candidatesCountInput.value
            };

            fetch('/general-save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                })
                .then(response => response.json())
                .then(data => {})
                .catch(error => {
                    console.error('Error saving general:', error);
                });
        }
    }

    async function fetchGeneralData() {

        try {
            const response = await fetch('/get-general-data');
            if (!response.ok) {
                throw new Error('Failed to fetch general data');
            }

            const data = await response.json();
            titleInput.value = data.title;
            candidatesCountInput.value = data.candidates_count;
        } catch (error) {
            console.error('Error fetching general data:', error);
        }
    }

    generalForm.addEventListener('submit', function(event) {
        event.preventDefault();
        toggleEditMode();
    });

    fetchGeneralData();

    document.getElementById("generateScore").addEventListener('click', function(event) {
        event.preventDefault();

        const confirmGenerate = confirm('This will reset the scores. Are you sure?');

        if (confirmGenerate) {
            fetch('/generate-scores')
            .then(response => response.json())
            .then(data => {})
            .catch(error => {
                console.error('Error generating scores:', error);
            });
        }

        
    });

    document.getElementById("generateTop5").addEventListener('click', function(event) {
        event.preventDefault();

        const confirmGenerate = confirm('Are you sure?');

        if (confirmGenerate) {
            fetch('/generate-top5')
            .then(response => response.json())
            .then(data => {})
            .catch(error => {
                console.error('Error generating scores:', error);
            });
        }

        
    });

});