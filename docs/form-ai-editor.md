# Form Builder AI Edit

The Form Builder editor can rewrite selected text or the entire document through the authenticated backend endpoint:

`POST /form-template/ai/edit`

## Backend configuration

Add the following values to `css_backend/.env`, then restart the backend:

```env
OPENAI_API_KEY=replace_with_a_project_api_key
OPENAI_EDITOR_MODEL=gpt-5-mini
OPENAI_EDITOR_TIMEOUT_MS=45000
OPENAI_EDITOR_MAX_OUTPUT_TOKENS=16000
```

Only `OPENAI_API_KEY` is required. The other values show the defaults.

Never add the API key to the React environment or commit it to source control. The browser calls the ASR backend, and only the backend calls the OpenAI Responses API.

## Safety behavior

- The endpoint requires an authenticated ASR user and is limited to 10 requests per minute per client.
- Every complete `{{shortcode}}` is replaced by a unique placeholder before content is sent to the model.
- A response is rejected if a placeholder is missing, duplicated, reordered, or changed.
- A selection that begins or ends inside a shortcode is rejected.
- Active HTML, event handlers, executable URLs, and embedded frames are rejected.
- The user must review and explicitly apply a suggestion.
- The complete editor document is shortcode-validated after an applied suggestion.
- Audit logs contain the user, form, action, model, sizes, and duration, but not document content.

AI suggestions do not replace legal or compliance review.
