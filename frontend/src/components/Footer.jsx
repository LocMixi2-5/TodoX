import React from "react";

const Footer = ({ 
    completedTasksCount = 2,
    activeTasksCount = 3
}) => {
    return <>
        { completedTasksCount + activeTasksCount > 0 && (
            <div className="text-center">
                <p className="text-sm text-muted-foreground">
                    {
                        completedTasksCount > 0 && (
                            <>
                                <span role="img" aria-label="fireworks">🎆</span>
                                <span style={{ color: 'green', fontWeight: 'bold' }}>Tuyệt vời,</span> bạn đã <span className="bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent font-bold text-1xl">hoàn thành {completedTasksCount}</span> việc!
                                <span role="img" aria-label="sparkler">🎇</span>

                                {activeTasksCount > 0 && (
                                <>
                                    <br />
                                    <span style={{ color: 'red', fontWeight: 'bold' }}>Còn {activeTasksCount} việc</span> nữa thôi. Cố gắng lên!
                                </>
                                )}
                            </>
                        )
                    }

                    {completedTasksCount === 0 && activeTasksCount > 0 && (
                        <p
                        
                        >
                            <span style={{ color: 'red', fontWeight: 'bold' }}>Hãy bắt đầu</span> làm bạn còn{' '}
                            <span style={{ color: 'green', fontWeight: 'bold' }}>{activeTasksCount}</span> nhiệm vụ nữa!
                        </p>
                    )}
                </p>
            </div>
        )

        }
    </>
    
};

export default Footer;