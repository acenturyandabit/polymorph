# Conventions
- Outerdiv > innerDiv
- Internally, always pass containerIDs, rectIDs rather than live containers or rects.
    - As a result, containers and rects must enforce their place in core ASAP.
    - Externally (for operator instantiation), we pass a container object, because that's easier to work with and reduces code duplication.
- Expect `undefined` return on failure.