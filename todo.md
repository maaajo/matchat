- [x] Enter should send a message
- [x] Show tooltip that SHIFT + Enter starts new line
- [x] Disable send button when no text
- [x] Disable also when no text to send with Enter
- [x] Show toast when trying to enter and no message
- [x] Add tooltip with denied cursor when no message saying missing message
- [x] Check if it's possible to not render on each keystroke because of the
      message useWatch
- [x] Add tooltip to button when message is required
- [x] Add tooltip to button to send message
- [x] When message was send we should render pause with rectangle icon to pause
      it
- [x] Add tooltip for cancel generation
- [x] When aborted partial text is cleared
- [x] When aborted always render at the bottom red alert saying aborted by the
      user
- [x] When aborted we should not send the previous response id but have the one
      that succeeded?
      {{"errorCode":400,"errorMessage":"Previous response with id 'resp_68bfe4292dc081939d6b03fbf7705bf7006fffc95e9d1bc2' not found.","status":"error","timestamp":"2025-09-09T08:26:05.127Z"}}
- [x] The chat container should be scrollable area
- [x] Use use-stick-to-bottom for smooth scrolling when loading
- [x] Add scroll button in the chat container being rendered
- [x] StickToBottom should be used in ChatContainer
- [x] Stick to bottom button should be it's onw component imported and looking
      differently
- [x] The scrollable area should be the entire page
- [x] The messages should appear as they are rendered behind the Section with
      TextArea
- [x] Fix the positioning of the scroll to bottom button
- [x] Fix the positioning of the welcome message
- [x] Add trpc
- [x] Add chat schema to db
- [x] Generate Chat title
- [x] When new chat starts we should assign new id and change route
- [x] Save chat to db with trpc
- [x] Change page title when chat is there
- [x] Save messages to db
- [x] Show chat title as a floating pill on top
- [x] Save last valid previous response id
- [x] Add chat id route
- [x] Chat title now is causing layout shift done. we shoudl show empty with
      loading message and then render title when ready
- [x] Add sidebar
- [x] Add sidebar with past chats
- [x] Add is chat loading to the db
- [x] on chat insert set chat loading to true
- [x] on successfull generation of first message set isLoading to false
- [x] add this to the sidebar chats so they show it's loading
- [x] check why isAtBottom is showing true always
- [x] Add skeletons for past chats
- [x] add streamdown for markdown rendering
- [ ] add x icon to chats so we you can remove them
- [ ] show only 100 chats, if wanting more then show button to load more
- [ ] add search of chats
- [ ] Add model name to the chat message
- [ ] Add date to chat message?
- [ ] Add start new chat
- [ ] Make the button whn stream is generating pulsating
- [ ] Add prompt library
- [ ] Add db for chat, messages
- [ ] Add model change
- [ ] Add chat message actions
- [ ] Add pdf and image attachments
- [ ] Maybe all the default/fallback message should be an object?
