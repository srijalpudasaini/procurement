const Alert = ({ type, message }) => {
    const style = {
        'success' : 'text-green-800 bg-green-200 border-green-800',
        'error': 'text-red-800 bg-red-200 border-red-800'
    }

    return (
        <div className={`my-3 px-3 py-4 border-l-4 ${style[type]}`}>
            {message}
        </div>
    )
}

export default Alert