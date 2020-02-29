## Firebase notes

Issue: limited bandwidth.
Solution: get changes fibbonacilly (1,1,2,3,5,8), sorting by date_changed. Stop fetching once done.

Issue: Each savesource is standalone, but we want to reduce bandwidth so we dont download the whole firebase stack, only changes.
Solution: In which case, firebase is constructed so that it caches locally and then goes to FB and updates there. This also allows offline!
