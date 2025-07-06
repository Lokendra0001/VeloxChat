import toast from "react-hot-toast";

const handleSuccessMsg = (msg) => {
    toast.success(msg)
}

const handleErrorMsg = (msg) => {
    toast.error(msg)
}

// const handleProcessAndSuccess = (promiseFn) => {
//     toast.promise(
//         promiseFn,
//         {
//             loading: 'Logging in...',
//             success: <b>Login Successfully!</b>,
//             error: <b>Something Went Wrong.</b>,
//         }
//     );
// };


export {
    handleErrorMsg,
    handleSuccessMsg,
    // handleProcessAndSuccess
}
