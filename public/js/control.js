const top5 = [];

document.addEventListener('DOMContentLoaded', function () {
    async function fetchAndPopulateSegmentList() {
        const response = await fetch('/get-segments');
        const segments = await response.json();

        // Fetch active segment from general table
        const responseGeneral = await fetch('/get-general-data');
        const generalData = await responseGeneral.json();
        activeSegmentId = generalData.active_segment;

        const segmentList = document.getElementById('segmentList');
        segmentList.innerHTML = ''; // Clear existing segments

        // Organize segments into three columns
        const columns = [
            [],
            [],
            []
        ];

        segments.forEach((segment, index) => {
            columns[index % 3].push(segment);
        });

        columns.forEach(column => {
            const cardColumn = document.createElement('div');
            cardColumn.classList.add('col-md-4'); // Adjust the width as needed

            column.forEach(segment => {
                const card = document.createElement('div');
                card.classList.add('card', 'mb-4');

                const cardBody = document.createElement('div');
                cardBody.classList.add('card-body', 'd-flex', 'align-items-center', 'justify-content-around');

                const cardTitle = document.createElement('h5');
                cardTitle.classList.add('card-title');
                cardTitle.textContent = segment.name;

                cardBody.appendChild(cardTitle);

                // Fetch criteria for the current segment
                // fetchCriteriaForSegment(segment.id, cardBody);

                card.appendChild(cardBody);

                // Highlight the active segment
                if (segment.id === activeSegmentId) {
                    card.classList.add('bg-primary', 'text-white');
                }

                if (segment.id !== activeSegmentId) {
                    const btnDiv = document.createElement('div');

                    const setActiveButton = document.createElement('button');
                    setActiveButton.classList.add('btn', 'btn-warning', 'btn-sm', 'mb-2');
                    setActiveButton.textContent = 'Set as Current';
                    setActiveButton.onclick = function () {
                        setSegmentActive(segment.id);
                    };
                    cardBody.appendChild(setActiveButton);
                }

                cardColumn.appendChild(card);
            });

            segmentList.appendChild(cardColumn);
        });
    }


    // Function to fetch criteria for a specific segment
    async function fetchCriteriaForSegment(segmentId, cardBody) {
        const responseCriteria = await fetch(`/get-segment-criteria/${segmentId}`);
        const criteriaList = await responseCriteria.json();

        const criteriaListContainer = document.createElement('ul');
        criteriaListContainer.classList.add('list-group');

        criteriaList.forEach(criteria => {
            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

            const criteriaName = document.createTextNode(criteria.name);
            const badge = document.createElement('span');
            badge.classList.add('badge', 'badge-primary', 'badge-pill');
            badge.textContent = `${criteria.percent}%`;

            listItem.appendChild(criteriaName);
            listItem.appendChild(badge);

            criteriaListContainer.appendChild(listItem);
        });

        cardBody.appendChild(criteriaListContainer);
    }

    // Fetch and set the active segment
    async function setSegmentActive(segmentId) {
        const response = await fetch('/activate-segment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ segmentId }),
        });

        const data = await response.json();
        if (data.success) {
            // Reload the segment list after setting the active segment
            fetchAndPopulateSegmentList();
        } else {
            alert('Failed to set active segment.');
        }
    }

    // Call the function to fetch and populate the segment list on page load
    fetchAndPopulateSegmentList();

    async function fetchScores() {
        const scoreContainer = document.getElementById('scoreContainer');
        const segments = await fetchSegmentIds();
        const criteria = [];


        //console.log(segments);
        for (const segment of segments) {
            const segmentAverage = [];  //for ranking

            const card = document.createElement('div');
            card.classList.add('card', 'mb-4');

            const cardHeader = document.createElement('div');
            cardHeader.className = 'card-header';
            card.appendChild(cardHeader);

            const cardTitle = document.createElement('h5');
            cardTitle.classList.add('card-title');


            const cardContent = document.createElement('div');
            cardContent.classList.add('row');
            
            const cardContentCol1 = document.createElement('div');
            cardContentCol1.classList.add('col-md-8');
            cardContentCol1.innerHTML = `<h5">${segment.name}</h5>`;
            cardContent.appendChild(cardContentCol1);

            const cardContentCol2 = document.createElement('div');
            cardContentCol2.classList.add('col-md-4');
            const printButton = document.createElement('button');
            printButton.className = "btn btn-primary float-right";
            printButton.textContent = "Print";
            printButton.onclick = function () {
                printScores(segment.id);
            };
            cardContentCol2.appendChild(printButton);
            cardContent.appendChild(cardContentCol2);


            cardTitle.appendChild(cardContent);

        
            //cardTitle.textContent = segment.name;
            cardHeader.appendChild(cardTitle);

            

            const cardBody = document.createElement('div');
            cardBody.classList.add('card-body', 'd-flex', 'align-items-center', 'justify-content-around');

            card.appendChild(cardBody);

            //const printButton = document.getElementById('printButton');
            // printButton.className = "btn btn-primary float-right";
            // printButton.textContent = "Print";
            // cardHeader.appendChild(printButton);
            

            const criteria = await fetchCriteriaBySegment(segment.id);
            const judges = await fetchJudges();

            const candidateScores = [];

            for (const j of judges) {
                //display the table and return the 
                const scores = await fetchJudgeTotalScore(j.id, criteria);

                for (const score of scores) {
                    const index = score.candidate_number;
                    if (candidateScores[index] === undefined || !Array.isArray(candidateScores[index])) {
                        candidateScores[index] = []; // Create a new array at the specified index
                    }

                    candidateScores[index].push({ judge: j.number, total_points: score.total_points });
                }
            }

            //variable for the data is candidateScores

            // Create a table
            const table = document.createElement('table');
            table.classList.add('table', 'table-bordered', 'table-striped', 'mb-3');
            cardBody.appendChild(table);

            // Create the table header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');

            // Add Candidate Number header
            var candidateNumberHeader = document.createElement('th');
            candidateNumberHeader.textContent = 'Contestant #';
            headerRow.appendChild(candidateNumberHeader);

            var judgeNums = Array.from(new Set(candidateScores.flat().map(item => item.judge)));

            // Add dynamic headers for each judge
            judgeNums.forEach(function (judge) {
                var judgeHeader = document.createElement('th');
                judgeHeader.textContent = 'Judge ' + judge;
                headerRow.appendChild(judgeHeader);
            });

            // Add Total, Average, and Rank headers
            var totalHeader = document.createElement('th');
            totalHeader.textContent = 'Total';
            headerRow.appendChild(totalHeader);

            var averageHeader = document.createElement('th');
            averageHeader.textContent = 'Average';
            headerRow.appendChild(averageHeader);

            var rankHeader = document.createElement('th');
            rankHeader.textContent = 'Rank';
            headerRow.appendChild(rankHeader);

            thead.appendChild(headerRow);
            table.appendChild(thead);

            const sortedCandidateScores = [...candidateScores];

            candidateAverage = [];

            for (const [i, scores] of sortedCandidateScores.entries()) {
                if (scores === undefined) continue;
                let totalPoints = 0;
                let judgeCount = 0; // this is created to only count judge that has score

                judgeNums.forEach(function (judge) {
                    var judgeData = scores.find(item => item.judge === judge) || { total_points: 0 };
                    totalPoints += judgeData.total_points;
                    if (judgeData.total_points !== 0) {
                        judgeCount++;
                    }
                });

                if (candidateAverage[i] === undefined) {
                    const average = totalPoints / judgeNums.length;
                    candidateAverage[i] = { candidate_number: i, average: parseFloat(average.toFixed(2)) };
                }

            };

            // Create table body
            var tbody = document.createElement('tbody');
            candidateScores.forEach((scores, i) => {
                var candidateRow = document.createElement('tr');
                var totalPoints = 0;
                var averagePoints = 0;

                // Add candidate number cell
                var candidateNumberCell = document.createElement('td');
                //candidateNumberCell.textContent = i; // Assuming candidate numbers start from 1
                candidateNumberCell.innerHTML = `<span class="badge badge-pill badge-dark">${i}</span>`;
                candidateRow.appendChild(candidateNumberCell);

                // Add judge cells and calculate total and average
                judgeNums.forEach(function (judge) {
                    var judgeData = scores.find(item => item.judge === judge) || { total_points: 0 };
                    var judgeCell = document.createElement('td');
                    judgeCell.textContent = judgeData.total_points;
                    candidateRow.appendChild(judgeCell);

                    totalPoints += judgeData.total_points;
                });

                // Add total cell
                var totalCell = document.createElement('td');
                totalCell.textContent = totalPoints;
                candidateRow.appendChild(totalCell);

                averagePoints = totalPoints / judgeNums.length;
                //static if segment is terna (4)
                if (segment.id == 4) {
                    // Calculate average
                    averagePoints = totalPoints / 3;
                }

                if (top5[i] === undefined) {
                    top5[i] = [];
                }

                segmentAverage.push(parseFloat(parseFloat(averagePoints.toFixed(2))));

                const segmentScore = { name: segment.name, score: 0 };  //THIS IS USED TO GET TOP 5
                //this is static from the database for top 5 selection
                segmentScore.score = averagePoints * .25; //get the percentage
                top5[i].push(segmentScore);



                // Add average cell
                var averageCell = document.createElement('td');
                averageCell.textContent = parseFloat(averagePoints.toFixed(2));
                candidateRow.appendChild(averageCell);

                // Add rank cell (you may implement ranking logic here)
                var rankCell = document.createElement('td');
                rankCell.className = "rank";
                // Implement ranking logic here based on average or total
                rankCell.textContent = getRank(candidateAverage, parseFloat(averagePoints.toFixed(2)));


                // if (segment.id == 4) {
                //     console.log(parseFloat(averagePoints.toFixed(2)));
                //     rankCell.textContent = getNumberRank(segmentAverage, parseFloat(averagePoints.toFixed(2)));
                // }

                candidateRow.appendChild(rankCell);

                tbody.appendChild(candidateRow);
            });

            table.appendChild(tbody);


            scoreContainer.appendChild(card);

            console.log(segmentAverage);
        }

        //console.log(top5);



        //DISPLAY TOP 5
        // const card = document.createElement('div');
        // card.classList.add('card', 'mb-4');

        // const cardHeader = document.createElement('div');
        // cardHeader.className = 'card-header';
        // card.appendChild(cardHeader);

        // const cardTitle = document.createElement('h5');
        // cardTitle.classList.add('card-title');
        // cardTitle.textContent = "Five Finalist";
        // cardHeader.appendChild(cardTitle);

        // const printButton = document.createElement('button');
        // printButton.className = "btn btn-primary float-right";
        // printButton.textContent = "Print";
        // cardHeader.appendChild(printButton);
        // printButton.addEventListener("click", (event) => {
        //     const button = event.target;
        //     const card = button.closest('.card');
        //     console.log(card);

        //     const table = card.querySelector('table');
        //     const title = card.querySelector('.card-header h5').textContent;
        //     if (table) {
        //         console.log(table);
        //         const printWindow = window.open('', '_blank');

        //         // Write the HTML content of the specific node to the new window
        //         printWindow.document.write('<html><head><title>Print</title></head><body>');
        //         printWindow.document.write('<style>');
        //         printWindow.document.write(`body { padding-top: 50px; font-family: 'Arial', sans-serif; }`);
        //         printWindow.document.write('.signatory-line { border-top: 2px solid #ddd; font-size: 15pt; margin-top: 10px; display: inline-block; text-align:center; width: 30%; margin-top: 80px; margin-right: 20px}');
        //         printWindow.document.write('h1, h2, h4, h3 { text-align: center; }');
        //         printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
        //         printWindow.document.write('th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }');
        //         printWindow.document.write('th { background-color: #f2f2f2; }');
        //         printWindow.document.write('</style>');
        //         printWindow.document.write('</head><body>');
        //         printWindow.document.write(`<h4>BALAOAN TOWN FIESTA 2023</h4>`);
        //         printWindow.document.write(`<h1>MUTYA NG BALAOAN 2024</h1>`);
        //         printWindow.document.write(`<h2>${title}</h2>`);
        //         printWindow.document.write(`<h3>Tabulation Sheet</h3>`);

        //         //--------------

        //         const tbody = table.querySelector('tbody');

        //         const rows = Array.from(tbody.getElementsByTagName('tr'));
        //         rows.sort((a, b) => {
        //             console.log(a);
        //             console.log(b);
        //             const rankA = parseFloat(a.querySelector('.rank').textContent);
        //             const rankB = parseFloat(b.querySelector('.rank').textContent);
        //             return rankA - rankB;
        //         });

        //         // Clear the existing tbody content
        //         tbody.innerHTML = '';

        //         // Append the sorted rows to the tbody
        //         rows.forEach(row => tbody.appendChild(row));

        //         // -------------------

        //         printWindow.document.write(table.outerHTML);

        //         for (let x = 0; x < 5; x++) {
        //             printWindow.document.write(`<div class="signatory-line">Judge No. ${x + 1}</div>`);

        //         }
        //         printWindow.document.write('</body></html>');
        //         printWindow.document.close();

        //         // Call the print method
        //         printWindow.print();

        //     }
        // });

        // const cardBody = document.createElement('div');
        // cardBody.classList.add('card-body', 'd-flex', 'align-items-center', 'justify-content-around');

        // card.appendChild(cardBody);

        // const tableTop5 = document.createElement('table');
        // tableTop5.className = 'table table-bordered';
        // cardBody.appendChild(tableTop5);

        // const thead2 = document.createElement('thead');
        // tableTop5.appendChild(thead2);

        // const trHead = document.createElement('tr');
        // thead2.appendChild(trHead);

        // const thCan = document.createElement('th');
        // thCan.textContent = "Candidate Number";
        // trHead.appendChild(thCan);


        // const th1 = document.createElement('th');
        // th1.textContent = "Swimsuit Competition";
        // trHead.appendChild(th1);

        // const th2 = document.createElement('th');
        // th2.textContent = "Evening Gown";
        // trHead.appendChild(th2);

        // const th3 = document.createElement('th');
        // th3.textContent = "Casual Interview";
        // trHead.appendChild(th3);

        // const th4 = document.createElement('th');
        // th4.textContent = "Ilocano Terna";
        // trHead.appendChild(th4);

        // const th5 = document.createElement('th');
        // th5.textContent = "Total";
        // trHead.appendChild(th5);

        // const th6 = document.createElement('th');
        // th6.textContent = "Rank";
        // trHead.appendChild(th6);

        // scoreContainer.appendChild(card);

        // const tbodyfinal = document.createElement('tbody');
        // tableTop5.appendChild(tbodyfinal);

        // const scoreForRanking = [];

        // //pre-gather available  scores
        // for (const [i, scores] of top5.entries()) {
        //     if (i == 0) continue;

        //     let total = 0;
        //     scores.forEach((score) => {
        //         total += score.score;
        //     });
        //     scoreForRanking.push(parseFloat(total.toFixed(2)));
        // }



        // for (const [i, scores] of top5.entries()) {
        //     if (i == 0) continue;

        //     const tr = document.createElement('tr');
        //     tbodyfinal.appendChild(tr);

        //     const td1 = document.createElement('td');
        //     td1.textContent = i;
        //     tr.appendChild(td1);

        //     let totalTop5 = 0;
        //     scores.forEach((score) => {
        //         const td = document.createElement('td');
        //         td.textContent = parseFloat(score.score.toFixed(2));
        //         totalTop5 += score.score;
        //         tr.appendChild(td);
        //     });

        //     const tdTotal = document.createElement('td');
        //     tdTotal.textContent = totalTop5.toFixed(2);
        //     tr.appendChild(tdTotal);

        //     const tdRank = document.createElement('td');
        //     tdRank.className = "rank";
        //     tdRank.textContent = await getNumberRank(scoreForRanking, parseFloat(totalTop5.toFixed(2)));
        //     tr.appendChild(tdRank);

        // }

    }

    

    async function getNumberRank(arr, element) {
        // Clone the array to avoid modifying the original
        const sortedArray = [...arr];

        // Sort the array in descending order
        sortedArray.sort((a, b) => b - a);

        // Find the index of the target element in the sorted array
        const index = sortedArray.indexOf(element);

        // If the element is not found, return -1
        if (index === -1) {
            return -1;
        }

        // The rank is the index plus 1
        const rank = index + 1;

        return rank;

    }

    function getRank(baseData, value) {
        // Filter out entries with average value greater than 0
        const filteredData = baseData.filter(entry => entry.average > 0);

        // Sort the filtered data by average in descending order
        filteredData.sort((a, b) => b.average - a.average);

        let rank = 0; // Initialize rank
        let sumRanks = 0; // Initialize the sum of ranks for tied values
        let countTies = 0; // Initialize the count of tied values

        for (let i = 0; i < filteredData.length; i++) {
            const currentEntry = filteredData[i];

            if (i > 0 && currentEntry.average !== filteredData[i - 1].average) {
                // Assign average rank for tied values
                if (countTies > 1) {
                    const averageRank = sumRanks / countTies;
                    for (let j = i - countTies; j < i; j++) {
                        filteredData[j].rank = averageRank;
                    }
                    sumRanks = 0;
                    countTies = 0;
                }
            }

            rank += 1; // Increment rank for each entry

            // Check if the current entry's average matches the target value
            if (currentEntry.average === value) {
                return rank;
            }

            sumRanks += rank;
            countTies += 1;
        }

        // If there are tied values at the end of the array
        if (countTies > 1) {
            const averageRank = sumRanks / countTies;
            for (let j = filteredData.length - countTies; j < filteredData.length; j++) {
                filteredData[j].rank = averageRank;
            }
        }

        // Find the rank of the target value after processing ties
        const targetEntry = filteredData.find(entry => entry.average === value);
        return targetEntry ? targetEntry.rank : 0;
    }


    fetchScores();

    /**
     * get total scores for all criteria per candidate given by a 
     * specific judge 
     **/
    async function fetchJudgeTotalScore(judgeId, criteriaIds) {
        try {
            const url = `/get-scores3?judge_id=${judgeId}&criteria=${JSON.stringify(criteriaIds)}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    async function displayScoreTable(judgeId, criteriaIds, cardBody) {
        try {
            const url = `/get-scores2?judge_id=${judgeId}&criteria=${JSON.stringify(criteriaIds)}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            const scoreSummary = [];

            const groupedScores = groupData(data);
            console.log(groupedScores);

            // Create a table
            const table = document.createElement('table');
            table.classList.add('table', 'table-bordered', 'table-striped', 'mb-3');

            // Create the table header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = '<th>Contestant #</th>' +
                groupedScores[1].map(item => `<th>${item.name}</th>`).join('');
            thead.appendChild(headerRow);
            table.appendChild(thead);
            // Create the table body
            const tbody = document.createElement('tbody');
            for (const candidateNumber in groupedScores) {
                const group = groupedScores[candidateNumber];
                const row = document.createElement('tr');
                row.innerHTML = `<td>${candidateNumber}</td>` +
                    group.map(item => `<td>${item.points}</td>`).join('');
                tbody.appendChild(row);
                console.log(item.points);
                //get judge total
            }
            table.appendChild(tbody);

            // Append the table to the container
            // cardBody.appendChild(table); -----> UNCOMMENT THIS IF YOU WANT TO DIPLAY JUDGE SUMMARY

            return scoreSummary;
        } catch (error) {
            console.error('Error fetching data:', error);
            // Propagate the error to the caller
            throw error;
        }
    }

    function groupData(data) {
        const groupedData = data.reduce((grouped, item) => {
            const candidateNumber = item.candidate_number;
            if (!grouped[candidateNumber]) {
                grouped[candidateNumber] = [];
            }
            grouped[candidateNumber].push(item);
            return grouped;
        }, {});

        return groupedData;
    }

    async function fetchJudges() {
        const responseJudges = await fetch(`/get-judges`);
        const judgesList = await responseJudges.json();
        const judges = [];

        judgesList.forEach((judge) => {
            judges.push({ id: judge.id, number: judge.number });
        });

        return judges;
    }

    async function fetchCriteriaBySegment(segmentId) {
        const responseCriteria = await fetch(`/get-segment-criteria/${segmentId}`);
        const criteriaList = await responseCriteria.json();
        const criteria = [];

        criteriaList.forEach((c) => {
            criteria.push(c.id);
        });

        return criteria;
    }

    // Function to fetch and update segments table
    async function fetchSegmentIds() {
        const responseSegments = await fetch(`/get-segments`);
        const segmentList = await responseSegments.json();
        const segments = [];

        segmentList.forEach((segment) => {
            segments.push({ id: segment.id, name: segment.name });
        });

        return segments;
    }

    // Function to fetch criteria for a specific segment
    function fetchScores1() {
        const scoreContainer = document.getElementById('scoreContainer');
        fetch('/get-scores-report')
            .then(response => response.json())
            .then(data => {
                data.forEach((segment) => {
                    const segmentCard = document.createElement('div');
                    segmentCard.className = 'card mb-3';

                    const cardHeader = document.createElement('div');
                    cardHeader.className = 'card-header';
                    cardHeader.innerHTML = `<h5>${segment.name}</h5>`;
                    segmentCard.appendChild(cardHeader);

                    const cardBody = document.createElement('div');
                    cardBody.className = 'card-body';


                    segment.candidates.forEach((c) => {
                        const judgeContainer = document.createElement('div'); // Container for each judge's table
                        c.scores.forEach((s) => {
                            const judgeTable = document.createElement('table'); // Table for each judge
                            judgeTable.classList.add('table', 'table-bordered', 'table-striped', 'mb-3');

                            const thead = document.createElement('thead');
                            const headerRow = document.createElement('tr');
                            headerRow.innerHTML = `<th>Candidate</th>${s.points.map(p => `<th>${p.criteria_name}</th>`).join('')}<th>Total</th>`;
                            thead.appendChild(headerRow);
                            judgeTable.appendChild(thead);

                            const tbody = document.createElement('tbody');
                            const bodyRow = document.createElement('tr');
                            bodyRow.innerHTML = `<td>${c.candidate_number}</td>${s.points.map(p => `<td>${p.point}</td>`).join('')}<td>${s.points.reduce((acc, p) => acc + p.point, 0)}</td>`;
                            tbody.appendChild(bodyRow);
                            judgeTable.appendChild(tbody);

                            const judgeTitle = document.createElement('h3');
                            judgeTitle.innerHTML = `Judge No. ${s.judge_number}`;
                            judgeContainer.appendChild(judgeTitle);
                            judgeContainer.appendChild(judgeTable);
                        });
                        cardBody.appendChild(judgeContainer);
                        segmentCard.appendChild(cardBody);
                    });

                    scoreContainer.appendChild(segmentCard);

                });

            })
            .catch(error => {
                console.error('Error fetching segments:', error);
            });
    }


});