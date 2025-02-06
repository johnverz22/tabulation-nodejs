const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const bodyParser = require('body-parser');


const app = express();
const PORT = process.env.PORT || 80;
const dbFilePath = 'tabulation.db'; // Adjust the file path as needed

// Check if the database file already exists
const isDatabaseExist = fs.existsSync(dbFilePath);

// Initialize SQLite database
const db = new sqlite3.Database(dbFilePath);

db.serialize(() => {
    // db.run(`
    //   DROP TABLE score
    // `);

    db.run(`
    CREATE TABLE IF NOT EXISTS judges (
      id INTEGER PRIMARY KEY,
      number INTEGER,
      pin TEXT
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS segments (
      id INTEGER PRIMARY KEY,
      name TEXT
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS criteria (
      id INTEGER PRIMARY KEY,
      name TEXT,
      percent INTEGER,
      segment_id INTEGER,
      FOREIGN KEY (segment_id) REFERENCES segments(id)
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS general (
      title TEXT,
      candidates_count INTEGER,
      active_segment INTEGER DEFAULT 0
    )
  `);

    db.run(`
        CREATE TABLE IF NOT EXISTS score (
          id INTEGER PRIMARY KEY,
          candidate_number INTEGER,
          criteria_id INTEGER,
          judge_id INTEGER,
          points INTEGER DEFAULT 0,
          FOREIGN KEY (criteria_id) REFERENCES criteria(id)
          FOREIGN KEY (judge_id) REFERENCES judges(id)

        )
      `);
});

// Setup middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

//ADMIN
app.get('/setup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/setup.html'));
});


// Endpoint to save a segment
app.post('/segment-save', (req, res) => {
    const segmentName = req.body.name;

    if (!segmentName || segmentName.trim() === '') {
        return res.status(400).json({ error: 'Segment name is required' });
    }

    // Insert the segment into the SQLite database
    db.run('INSERT INTO segments (name) VALUES (?)', [segmentName], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to save segment' });
        }

        console.log(`A segment has been inserted with rowid ${this.lastID}`);
        res.json({ success: true });
    });
});


// Endpoint to update a segment
app.post('/segment-update', (req, res) => {
    const segmentId = req.body.segmentId;
    const updatedName = req.body.updatedName;

    // Update the segment in the SQLite database
    db.run('UPDATE segments SET name = ? WHERE id = ?', [updatedName, segmentId], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to update segment' });
        }

        console.log(`A segment has been updated with id ${segmentId}`);
        res.json({ success: true });
    });
});

// Endpoint to get all segments
app.get('/get-segments', (req, res) => {
    db.all('SELECT id, name FROM segments', [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to fetch segments' });
        }

        res.json(rows);
    });
});

// Endpoint to delete a segment
app.delete('/segment-delete/:id', (req, res) => {
    const segmentId = req.params.id;

    // Delete the segment from the SQLite database
    db.run('DELETE FROM segments WHERE id = ?', [segmentId], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to delete segment' });
        }

        console.log(`A segment has been deleted with id ${segmentId}`);
        res.json({ success: true });
    });
});

// Endpoint to save a criteria
app.post('/criteria-save', (req, res) => {
    const criteriaName = req.body.name;
    const percent = req.body.percent;
    const segmentId = req.body.segment_id;


    // Insert the segment into the SQLite database
    db.run('INSERT INTO criteria (name, percent, segment_id) VALUES (?, ?, ?)', [criteriaName, percent, segmentId], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to save criteria' });
        }

        console.log(`A criteria has been inserted with rowid ${this.lastID}`);
        res.json({ success: true });
    });
});

// Endpoint to get all segments
app.get('/get-criteria', (req, res) => {
    db.all('SELECT a.id, a.name as c_name, percent, segment_id, b.name as s_name FROM criteria a LEFT JOIN segments b ON a.segment_id = b.id', [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to fetch criteria' });
        }

        // Organize the criteria into a two-dimensional list grouped by segment_id
        const groupedCriteria = rows.reduce((acc, criteria) => {
            const segmentId = criteria.s_name;

            if (!acc[segmentId]) {
                acc[segmentId] = [];
            }

            acc[segmentId].push({
                id: criteria.id,
                c_name: criteria.c_name,
                percent: criteria.percent,
                segment_id: criteria.segment_id
            });

            return acc;
        }, {});

        res.json(groupedCriteria);
    });
});

// Endpoint to delete a criteria
app.delete('/criteria-delete/:id', (req, res) => {
    const criteriaId = req.params.id;

    // Delete the segment from the SQLite database
    db.run('DELETE FROM criteria WHERE id = ?', [criteriaId], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to delete segment' });
        }

        console.log(`A segment has been deleted with id ${criteriaId}`);
        res.json({ success: true });
    });
});

// Assuming you have some function to generate the judges
function generateJudges(numberOfJudges) {
    const judges = [];

    for (let i = 1; i <= numberOfJudges; i++) {
        const pin = generatePIN();
        judges.push({ number: i, pin });

        // Save judge to the database
        db.run('INSERT INTO judges (number, pin) VALUES (?, ?)', [i, pin]);
    }

    return judges;
}

// Helper function to generate a random access key
function generatePIN() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';


    const randomDigit1 = digits[Math.floor(Math.random() * digits.length)];
    const randomDigit2 = digits[Math.floor(Math.random() * digits.length)];
    const randomDigit3 = digits[Math.floor(Math.random() * digits.length)];
    const randomDigit4 = digits[Math.floor(Math.random() * digits.length)];

    return randomDigit1 + randomDigit2 + randomDigit3 + randomDigit4;
}

// Route to handle judges generation
app.post('/judges-generate', (req, res) => {
    const numberOfJudges = req.body.numberOfJudges;
    const generatedJudges = generateJudges(numberOfJudges);

    res.json({ generatedJudges: generatedJudges });
});

// Endpoint to get all judges
app.get('/get-judges', (req, res) => {
    db.all('SELECT id, number, pin FROM judges ORDER BY number', [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to fetch segments' });
        }

        res.json(rows);
    });
});

// Endpoint to delete a judge
app.delete('/judge-delete/:id', (req, res) => {
    const judgeId = req.params.id;

    // Delete the segment from the SQLite database
    db.run('DELETE FROM judges WHERE id = ?', [judgeId], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to delete judte' });
        }

        console.log(`A segment has been deleted with id ${judgeId}`);
        res.json({ success: true });
    });
});


// Endpoint to save general setting
app.post('/general-save', (req, res) => {
    const title = req.body.title;
    const candidatesCount = req.body.candidatesCount;

    db.get('SELECT * FROM general', [], (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        }

        // If the row exists, update it; otherwise, insert a new row
        if (!row) {
            // Insert the general into the SQLite database
            db.run('INSERT INTO general (title, candidates_count) VALUES (?, ?)', [title, candidatesCount], function(err) {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ error: 'Error saving general setting.' });
                }

                console.log(`General setting has been saved`);
                res.json({ success: true });
            });
        } else {
            // udpate the general into the SQLite database
            db.run('UPDATE general SET title = ?, candidates_count = ? ', [title, candidatesCount], function(err) {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ error: 'General setting saved.' });
                }

                console.log(`General setting has been saved`);
                res.json({ success: true });
            });

        }
    });


});

// Express route to fetch general data
app.get('/get-general-data', (req, res) => {
    db.get('SELECT * FROM general LIMIT 1', (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to fetch general data' });
        }

        // If the row is empty, return an empty JSON object with keys
        const data = row || { title: '', candidates_count: 0, active_segment: 0 };
        res.json(data);
    });
});

// Express route to fetch segment name by segment ID
app.get('/get-segment-name/:segmentId', (req, res) => {
    const segmentId = req.params.segmentId;

    db.get('SELECT name FROM segments WHERE id = ?', [segmentId], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to fetch segment name' });
        }

        // If the row is empty, return an empty JSON object with keys
        const segmentName = row ? row.name : 'Default Segment';
        res.send(segmentName);
    });



});

app.get('/get-segment-criteria/:segmentId', (req, res) => {
    const segmentId = req.params.segmentId;

    db.all('SELECT id, name, percent FROM criteria WHERE segment_id = ?', [segmentId], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to fetch criteria by segment' });
        }

        res.json(row);
    });



});

// Define route to set the active segment
app.post('/activate-segment', (req, res) => {
    const { segmentId } = req.body;

    // Check if the 'general' table has a row
    db.get('SELECT * FROM general LIMIT 1', (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to fetch data from the general table' });
        }

        if (row) {
            // The 'general' table has a row, update the active segment
            db.run('UPDATE general SET active_segment = ?', [segmentId], (err) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ error: 'Failed to set the active segment' });
                }

                res.json({ success: true });
            });
        } else {
            return res.status(404).json({ error: 'No row found in the general table' });
        }
    });
});

//CONTROL
app.get('/control', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/control.html'));
});

//LOGIN
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

// Endpoint to check the PIN against the Judge table
app.post('/authenticate', (req, res) => {
    const { pin } = req.body;

    // Query the database to check if the PIN exists
    db.get('SELECT * FROM judges WHERE pin = ?', [pin], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (row) {
            // PIN exists, return success
            res.json({ success: true, judgeNo: row.id, number: row.number});
        } else {
            // PIN doesn't exist, return failure
            res.json({ success: false });
        }
    });
});

// Define route to set the active segment
app.get('/generate-scores', (req, res) => {
    db.serialize(() => {
        db.run(`
        DROP TABLE score
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS score (
              id INTEGER PRIMARY KEY,
              candidate_number INTEGER,
              criteria_id INTEGER,
              judge_id INTEGER,
              points INTEGER DEFAULT 0,
              FOREIGN KEY (criteria_id) REFERENCES criteria(id)
              FOREIGN KEY (judge_id) REFERENCES judges(id)

            )
          `);

        db.get('SELECT * FROM general LIMIT 1', [], (err, row1) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            if (row1) {
                const valueList = [];
                const judgeList = [];
                const segmentId = row1.active_segment;

                //get criterias
                db.all('SELECT * FROM judges', [], (err, judges) => {
                    if (err) {
                        console.error(err.message);
                        return res.status(500).json({ error: 'Internal Server Error' });
                    }

                    judges.forEach((judge) => {
                        judgeList.push(judge.id);
                    });

                });


                //get criterias
                db.all('SELECT * FROM criteria', [], (err, criteria) => {
                    if (err) {
                        console.error(err.message);
                        return res.status(500).json({ error: 'Internal Server Error' });
                    }


                    // Iterate over the criteria
                    criteria.forEach((criterium) => {
                        for (let i = 1; i <= row1.candidates_count; i++) {
                            judgeList.forEach((judge) => {
                                const values = `(${i}, ${criterium.id}, ${judge})`;
                                valueList.push(values);
                            });
                        }
                    });

                    const valuesString = valueList.join(', ');
                    const insertStatement = `INSERT INTO score (candidate_number, criteria_id, judge_id) VALUES ${valuesString}`;
                    db.run(insertStatement, function(err) {
                        if (err) {
                            console.error(err.message);
                            return;
                        }
                    });
                });
            }
        });

    });
});

app.get('/get-scores', (req, res) => {
    // Extract parameters from the query string
    const judgeId = req.query.judge_id;
    const candidateId = req.query.candidate_number;
    const criteriaIds = JSON.parse(req.query.criteria);

    const query = `
      SELECT *
      FROM score
      WHERE judge_id = ? AND candidate_number = ? AND criteria_id IN (${criteriaIds.map(() => '?').join(', ')})
    `;

    const params = [judgeId, candidateId, ...criteriaIds];

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.json(rows);
    });
});

// Route to save score
app.post('/score-save', (req, res) => {
    const scoreId = req.body.scoreId;
    const points = req.body.points;

    db.run('UPDATE score SET points = ? WHERE id = ?', [points, scoreId], (err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to set the active segment' });
        }

        res.json({ success: true });
    });
});

app.get('/get-scores-report', (req, res) => {
    const query = `
      SELECT candidate_number, judge_id, criteria_id, points,
      b.number as judge_number, c.name, c.percent, d.name as segment, d.id as segment_id
      FROM score a 
      LEFT JOIN judges b ON a.judge_id = b.id
      LEFT JOIN criteria c on a.criteria_id = c.id
      LEFT JOIN segments d on c.segment_id = d.id
    `;


    db.all(query, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        const result = {};

        rows.forEach((row) => {
            const { segment, candidate_number, criteria_id, judge_number, points, name, percent, segment_id } = row;

            if (!result[segment]) {
                result[segment] = {
                    name: segment,
                    candidates: {},
                };
            }

            if (!result[segment].candidates[candidate_number]) {
                result[segment].candidates[candidate_number] = {
                    candidate_number,
                    scores: [],
                };
            }

            const candidate = result[segment].candidates[candidate_number];

            // Check if there is already a score for the judge
            const existingScoreIndex = candidate.scores.findIndex(score => score.judge_number === judge_number);

            if (existingScoreIndex !== -1) {
                // If the judge already has a score, update the points
                candidate.scores[existingScoreIndex].points.push({
                    criteria_id,
                    raw_points: points,
                    criteria_name: name,
                    criteria_percent: percent,
                });
            } else {
                // If the judge doesn't have a score, create a new one
                candidate.scores.push({
                    judge_number,
                    points: [{
                        criteria_id,
                        point: points,
                        criteria_name: name,
                        criteria_percent: percent,
                    }],
                });
            }
        });

        const data = Object.values(result).map(segment => ({
            name: segment.name,
            candidates: Object.values(segment.candidates).map(candidate => ({
                candidate_number: candidate.candidate_number,
                scores: candidate.scores,
            })),
        }));

        // console.log(data);

        res.json(data);
    });
});

app.get('/get-scores2', (req, res) => {
    // Extract parameters from the query string
    const judgeId = req.query.judge_id;
    const criteriaIds = JSON.parse(req.query.criteria);

    const query = `
      SELECT a.id, candidate_number, judge_id, points, percent as max, b.name
      FROM score a
      LEFT JOIN criteria b on a.criteria_id = b.id
      WHERE judge_id = ? AND criteria_id IN (${criteriaIds.map(() => '?').join(', ')})
      ORDER BY candidate_number
    `;

    const params = [judgeId, ...criteriaIds];

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.json(rows);
    });
});

app.get('/get-scores3', (req, res) => {
    // Extract parameters from the query string
    const judgeId = req.query.judge_id;
    const criteriaIds = JSON.parse(req.query.criteria);

    const query = `
      SELECT candidate_number, SUM(points) AS total_points
      FROM score
      WHERE judge_id = ? AND criteria_id IN (${criteriaIds.map(() => '?').join(', ')})
      GROUP BY candidate_number
      ORDER BY candidate_number
    `;

    const params = [judgeId, ...criteriaIds];

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        res.json(rows);
    });
});

app.get('/generate-top5', (req, res) => {
    const top5SegmentId = 5;  //static

    //fetch segment total per candidate

    //get percentage

    db.all('SELECT id, name, percent FROM criteria WHERE segment_id = ?', [top5SegmentId], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to fetch criteria by segment' });
        }

        // rows.forEach((criteria) => {
        //     if(criteria.id == 15){

        //     }else if(criteria.id)


        //     //console.log(row);
        // });

    });
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}/`);
});