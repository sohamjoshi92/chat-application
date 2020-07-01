const socket = io()

const message = document.querySelector('input')
const button = document.querySelector('#send')
const locationButton = document.querySelector('#sendLocation')
const form = document.querySelector('#message-form')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix : true })

const autoScroll = () => {
    const $newmessage = $messages.lastElementChild
    const newMsgStyle = getComputedStyle($newmessage)
    const newMsgMargin = parseInt(newMsgStyle.marginBottom)
    const newMsgHeight = $newmessage.offsetHeight + newMsgMargin
    const visibleHeight = $messages.offsetHeight
    const contentHeight = $messages.scrollHeight
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(contentHeight - newMsgHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username : message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('location', (location) => {
    console.log(location)
    const html = Mustache.render(locationTemplate, {
        username : location.username,
        location : location.location,
        createdAt : moment(location.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

button.addEventListener('click', (e) => {
    e.preventDefault()
    button.setAttribute('disabled', 'disabled')
    
    socket.emit('messageSent', message.value, (error) => {
        button.removeAttribute('disabled')
        message.value = ''
        message.focus()
        if(error){
            return console.log(error)
        }
        console.log('Message Delivered')
    })
})

locationButton.addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Location not supported')
    }
    locationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sentLocation', {
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        }, () => {
            locationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
}) 