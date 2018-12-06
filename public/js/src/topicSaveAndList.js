function saveTopicToUser() {
    console.log(`Sending POST to ${window.location.pathname}/savetopic`);
    let saveBtn = document.getElementById('saveBtn');
    let action = saveBtn.classList.contains('saved') ? 'unsave' : 'save';
        
    fetch(`${window.location.pathname}/savetopic`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({action}),
    }).then(function (data) {
        window.location.reload(false);
    }).catch(function (error) {
        console.log('Request failure: ', error);  
    });
};
function listUserOnTopic(){
    console.log(`Sending POST to ${window.location.pathname}/listuser`);
    let listBtn = document.getElementById('listBtn');
    let action = listBtn.classList.contains('listed') ? 'unlist' : 'list';
    
    fetch(`${window.location.pathname}/listuser`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({action})
    }).then(function (data) {
        window.location.reload(false);
    }).catch(function (error) {  
        console.log('Request failure: ', error);  
    });
};