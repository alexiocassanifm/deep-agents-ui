# Test Procedure for Interrupt Support

## Prerequisites

1. **Backend Setup (Atlas V1)**:
   - Ensure Atlas V1 is deployed as a LangGraph deployment
   - Confirm `atlas_tools.py` is in place with interrupt support
   - Verify `InMemorySaver` checkpointer is configured

2. **Frontend Setup (deep-agents-ui)**:
   - Install dependencies: `npm install`
   - Start development server: `npm run dev`
   - Ensure LangGraph deployment URL is configured

## Test Steps

### Step 1: Basic Interrupt Test

1. Open the UI at http://localhost:3000
2. Start a new conversation
3. Send a message that triggers the discussion phase:
   ```
   I need help with user authentication. Please ask me clarifying questions.
   ```

### Step 2: Verify Interrupt Dialog Appears

When the agent calls `human_input()`:
- [ ] The InterruptDialog should appear as an overlay
- [ ] The agent's question should be displayed
- [ ] The regular chat input should be disabled
- [ ] The placeholder text should change to "Waiting for your response above..."

### Step 3: Submit Response

1. Type a response in the InterruptDialog input field
2. Click "Send" or press Enter
3. Verify:
   - [ ] Dialog closes immediately
   - [ ] Response is sent to the agent
   - [ ] Agent continues processing with the response
   - [ ] Regular chat input is re-enabled

### Step 4: Multiple Interrupts

Test that multiple interrupts work in sequence:
1. Trigger a scenario with multiple questions
2. Answer each one as it appears
3. Verify the flow continues correctly

## Expected Behavior

### When Interrupt is Active:
- ✅ Modal overlay blocks other interactions
- ✅ Question is clearly displayed
- ✅ Input field is auto-focused
- ✅ Send button is enabled only with text
- ✅ Main chat input is disabled

### After Submitting Response:
- ✅ Dialog disappears
- ✅ Agent receives the response
- ✅ Execution continues
- ✅ Normal chat functionality resumes

## Debugging Tips

### Check Browser Console for:
```javascript
// Look for interrupt state
console.log(stream.interrupt)

// Check if resume is called
// Should see network request with: { command: { resume: "user response" } }
```

### Common Issues:

1. **Dialog doesn't appear**:
   - Check if `stream.interrupt` is populated
   - Verify backend is using `interrupt()` not old `human_input`

2. **Response not sent**:
   - Check network tab for resume command
   - Verify `resumeWithValue` is being called

3. **Agent doesn't continue**:
   - Ensure backend checkpointer is configured
   - Verify thread_id is being passed

## Success Criteria

- [ ] InterruptDialog appears when agent needs input
- [ ] User can provide response
- [ ] Agent receives and processes response
- [ ] Flow continues seamlessly
- [ ] UI returns to normal state after interrupt

## Notes

- The interrupt mechanism requires a checkpointer (InMemorySaver)
- Thread ID must be maintained throughout the conversation
- Backend must use the enhanced `human_input` from `atlas_tools.py`