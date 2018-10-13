// Toggle list of managers
var toggleManagers = false;
$('#toggleManagers').on('click', function() {
    if (toggleManagers) { // If managers are visible
        $('#managers').css('display', 'none'); // Make them invisible
        $('#toggleManagers').html('+');
        toggleManagers = false;
    } else { // If managers are invisible
        $('#managers').css('display', 'block'); // Make them visible
        $('#toggleManagers').html('-');
        toggleManagers = true;
    }
});

// Toggle list of canvassers
var toggleCanvassers = false;
$('#toggleCanvassers').on('click', function() {
    if (toggleCanvassers) { // If canvassers are visible
        $('#canvassers').css('display', 'none'); // Make them invisible
        $('#toggleCanvassers').html('+');
        toggleCanvassers = false;
    } else { // If canvassers are invisible
        $('#canvassers').css('display', 'block'); // Make them visible
        $('#toggleCanvassers').html('-');
        toggleCanvassers = true;
    }
});

// Code that controls the questionnaire
var nquestions = 0; // Number of questions

// Renumber the questions so they correctly go from 1, 2, ... , n
function renumberQuestions() {
    var questions = document.getElementById('questions').children; // Get all questions
    for (var i = 1;i <= nquestions;i += 1) { // For each question
        var question = questions[i - 1];
        question.setAttribute('id', 'q' + i); // Change each number to the expected value at that position
        var num = question.children[0];
        num.children[0].setAttribute('for', 'question' + i);
        num.children[0].innerHTML = i;
        var main = question.children[1];
        main.children[0].setAttribute('id', 'question' + i);
        main.children[0].setAttribute('placeholder', 'Question ' + i);
        var remove = question.children[2];
        remove.children[0].setAttribute('id', 'removeQuestion' + i);
    }
}

// Remove a question
function removeQuestion(event) {
    var removeButton = event.currentTarget; // Find the remove button that was pressed
    var i = removeButton.id.slice(14); // Use it to find the ID of the question we are removing
    $('#q' + i).remove(); // Remove that questions
    nquestions -= 1;
    renumberQuestions(); // Renumber the questions properly
}

// Add a question
function addQuestion() {
    nquestions += 1;

    var row = document.createElement('div'); // New form-row div
    row.classList.add('form-row');
    row.setAttribute('id', 'q' + nquestions);

    var num = document.createElement('div'); // Div col-1
    num.classList.add('col-1');
    var label = document.createElement('label'); // Contains label and number
    label.setAttribute('for', 'question' + nquestions);
    label.innerHTML = nquestions;
    num.appendChild(label);

    var main = document.createElement('div'); // Div col-10
    main.classList.add('col-10');
    var input = document.createElement('input');  // Contains the question text input
    input.classList.add('form-control');
    input.setAttribute('type', 'text');
    input.setAttribute('id', 'question' + nquestions);
    input.setAttribute('name', 'question' + nquestions);
    input.setAttribute('placeholder', 'Question ' + nquestions);
    main.appendChild(input);

    var remove = document.createElement('div'); // Div col-1
    remove.classList.add('col-1');
    var button = document.createElement('button'); // Contains the remove question button for this question
    button.classList.add('btn');
    button.classList.add('btn-sm');
    button.setAttribute('type', 'button');
    button.setAttribute('id', 'removeQuestion' + nquestions);
    button.innerHTML = 'X';
    remove.appendChild(button);

    // Add all of them to the div row
    row.appendChild(num);
    row.appendChild(main);
    row.appendChild(remove);

    var questions = document.getElementById('questions');
    questions.appendChild(row); // Add the div row to the list of questions

    $('#removeQuestion' + nquestions).on('click', removeQuestion); // Bind the new remove question button
}

$('#addQuestion').on('click', addQuestion); // Bind the add question button

addQuestion(); // Start with one question
