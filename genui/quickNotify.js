function quickNotify(txt, ask, denyFn) {
    try {
        // Let's check whether notification permissions have already been granted
        if (Notification.permission === "granted") {
            // If it's okay let's create a notification
            var notification = new Notification(txt);
        }

        // Otherwise, we need to ask the user for permission
        else if (Notification.permission !== "denied" || ask == true) {
            Notification.requestPermission().then(function (permission) {
                // If the user accepts, let's create a notification
                if (permission === "granted") {
                    var notification = new Notification(txt);
                } else {
                    console.log("The browser does not support notifications, or notifications were denied. Notifications disabled!");
                    denyFn();
                }
            });
        }
    } catch (e) {
        console.log("The browser does not support notifications, or notifications were denied. Notifications disabled!");
        denyFn();
    }
}