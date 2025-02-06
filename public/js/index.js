document.addEventListener('DOMContentLoaded', function() {
    //check if judge is logged in

    // Check if the judge is already logged in
    const judgeNo = sessionStorage.getItem('judgeNo');
    const judgeTrueNumber = sessionStorage.getItem('judgeTrueNumber');

    



    if (!judgeNo) {
        // Redirect to the main judge page if already logged in
        window.location.href = '/login';
    }
    var currentCandidate = sessionStorage.getItem('currentCandidate');

    if (!currentCandidate)
        currentCandidate = 1;

    const segmentNameElement = document.getElementById('segmentName');
    const candidatePaginationElement = document.getElementById('candidatePagination');
    const scoresheetElement = document.getElementById('scoresheet');
    var generalData = {};

    // Fetch general data from the server
    async function fetchGeneralData() {
        const url = '/get-general-data';

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch general data');
            }

            generalData = await response.json();
            updatePageWithGeneralData(generalData);
        } catch (error) {
            console.error('Error fetching general data:', error);
        }
    }

    // Fetch and update page elements on page load
    fetchGeneralData();

    // Fetch segment name from the server using the segment ID
    async function fetchSegmentName() {
        const url = `/get-segment-name/${generalData.active_segment}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch segment name');
            }

            const segmentName = await response.text();
            return segmentName || 'Default Segment';
        } catch (error) {
            console.error('Error fetching segment name:', error);
            return 'Default Segment';
        }
    }

    // Fetch criteria data from the server
    async function fetchCriteriaData() {
        const url = `/get-segment-criteria/${generalData.active_segment}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch criteria data');
            }

            const criteriaList = await response.json();
            updateCriteriaSliders(criteriaList);
        } catch (error) {
            console.error('Error fetching criteria data:', error);
        }
    }

    // Update the page elements with data from the server
    async function updatePageWithGeneralData(data) {
        // Fetch segment name based on the segment ID
        const segmentName = await fetchSegmentName();

        document.getElementById("judge-text").innerHTML=`
            <span class="rounded-pill p-2 px-3 border bg-primary text-white text-center w-25 mx-auto">${segmentName}</span>
            <span class="d-block py-3 h5">Judge #${judgeTrueNumber}</span>
            
        `;

        // Update jumbotron title
        document.querySelector('.jumbotron h1').textContent = data.title || 'Default Title';
        document.title = data.title || 'Default Title';

        

        // Update segment name
        segmentNameElement.textContent = `CONTESTANT NUMBER`;

        // Update candidate pagination buttons
        updateCandidatePagination();

        fetchCriteriaData();
    }

    // Update candidate pagination buttons
    function updateCandidatePagination(candidatesCount) {
        candidatesCount = generalData.candidates_count || 0;
        candidatePaginationElement.innerHTML = ''; // Clear existing buttons

        for (let i = 1; i <= candidatesCount; i++) {
            const button = document.createElement('li');
            button.classList.add('page-item');
            const a = document.createElement('a');
            a.href = '#';
            a.classList.add('page-link');
            a.textContent = i;
            a.onclick = function(event) {
                currentCandidate = i;
                sessionStorage.setItem('currentCandidate', i);

                const activeButton = document.querySelector('#candidatePagination li.active');
                if (activeButton) {
                    activeButton.classList.remove("active");
                }

                // Select all <li> elements inside #candidatePagination
                const candidateButtons = document.querySelectorAll('#candidatePagination li');

                candidateButtons[i - 1].classList.add("active");

                //update scores for new candidate
                fetchGeneralData();


                event.preventDefault();
            };
            if (currentCandidate == i)
                button.classList.add('active');
            button.appendChild(a);
            candidatePaginationElement.appendChild(button);
        }
    }

    //fetch the score per criteria
    async function fetchScoresByCriteria(criteriaIds) {
        try {
            const url = `/get-scores?judge_id=${judgeNo}&candidate_number=${currentCandidate}&criteria=${JSON.stringify(criteriaIds)}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            const scores = data.map(score => ({
                criteria_id: score.criteria_id,
                score_id: score.id,
                points: score.points,
            }));

            return scores;
        } catch (error) {
            console.error('Error fetching data:', error);
            // Propagate the error to the caller
            throw error;
        }
    }

    // Update criteria sliders
    async function updateCriteriaSliders(criteriaList) {
        const criteriaSlidersElement = document.getElementById('criteriaSliders');
        const totalScoreElement = document.getElementById('scoreTotal');

        criteriaSlidersElement.innerHTML = ''; // Clear existing sliders

        //get a list of ids
        const criteriaIds = [];
        criteriaList.forEach(criteriaItem => {
            criteriaIds.push(criteriaItem.id);
        });

        //fetch scores here
        const scores = await fetchScoresByCriteria(criteriaIds);

        let totalScore = 0;

        //setup sliders and scores
        criteriaList.forEach(criteriaItem => {
            //get score per criteria 
            const score = scores.find(obj => obj.criteria_id === criteriaItem.id);
            totalScore += parseInt(score.points);

            const criteriaNameContainer = document.createElement('div');
            criteriaNameContainer.classList.add('row');

            const criteriaCol = document.createElement('div');
            criteriaCol.classList.add('col-md-11', 'col-sm-11');

            const criteriaLabel = document.createElement('h5');
            criteriaLabel.textContent = `${criteriaItem.name} - ${criteriaItem.percent}%`;
            criteriaLabel.innerHTML = `${criteriaItem.name} <span class="border border-success rounded p-1">${criteriaItem.percent}%</span>`;


            const scoreCol = document.createElement('div');
            scoreCol.classList.add('col-md-1', 'col-sm-1');

            const scoreLabel = document.createElement('h4');
            const scoreBadge = document.createElement('span');
            scoreBadge.classList.add('badge', 'slider-value', 'badge-success', 'float-right');
            scoreLabel.appendChild(scoreBadge);

            criteriaCol.appendChild(criteriaLabel);
            scoreCol.appendChild(scoreLabel);

            criteriaNameContainer.appendChild(criteriaCol);
            criteriaNameContainer.appendChild(scoreCol);

            const sliderContainer = document.createElement('div');
            sliderContainer.classList.add('criteria-slider', 'mb-4');
            sliderContainer.setAttribute('data-score-id', score.score_id);

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.classList.add('form-control-range');
            slider.min = '0';
            slider.max = criteriaItem.percent.toString(); // Set max value to percent
            slider.step = '1';
            slider.value = score.points.toString(); // Set default value to 1

            scoreBadge.textContent = `${slider.value}`;

            const delay = 500;
            let timeout;

            slider.addEventListener('input', function() {
                const scoreId = this.parentNode.dataset.scoreId;
                scoreBadge.textContent = `${this.value}`;

                scoreBadge.classList.remove('badge-success');
                scoreBadge.classList.add('badge-danger');

                //update total score
                const sliders = document.querySelectorAll('.form-control-range');

                totalScore = 0;
                sliders.forEach((slider) => {
                    totalScore += parseInt(slider.value);
                });

                totalScoreElement.textContent = totalScore.toString();

                // Clear previous timeout
                clearTimeout(timeout);

                // Add a new timeout to delay sending the value
                timeout = setTimeout(() => {
                    //send score
                    fetch('/score-save', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                scoreId: scoreId,
                                points: this.value,
                            }),
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! Status: ${response.status}`);
                            }
                            return response.json();
                        })
                        .then(data => {
                            if (data.success == true) {
                                scoreBadge.classList.remove('badge-danger');
                                scoreBadge.classList.add('badge-success');
                            }
                        })
                        .catch(error => {
                            console.error('Fetch error:', error);
                        });



                }, delay); // Adjust the delay as needed

            });

            sliderContainer.appendChild(slider);

            criteriaSlidersElement.appendChild(criteriaNameContainer);
            criteriaSlidersElement.appendChild(sliderContainer);
        });
        totalScoreElement.textContent = totalScore.toString();
        
    }



    function logout() {
        sessionStorage.removeItem('judgeNo');
        sessionStorage.removeItem('judgeTrueNumber');
        sessionStorage.removeItem('currentCandidate');


        window.location.href = '/login';
    }

    const logoutLink = document.getElementById('logoutLink'); // Replace with the actual ID or selector of your logout button

    logoutLink.addEventListener('click', logout);
});