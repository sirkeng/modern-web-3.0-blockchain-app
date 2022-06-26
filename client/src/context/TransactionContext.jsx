import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'

import { contractABI, contractAddress } from '../utils/constants'

export const TransactionContext = React.createContext()

const { ethereum } = window

const getEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum)
    const signer = provider.getSigner()
    const transactionContract = new ethers.Contract(contractAddress, contractABI, signer)

    return transactionContract
}

export const TransactionProvider = ({ children }) => {
    const [currentAccount, setCurrentAccount] = useState('')
    const [formData, setFormData] = useState({ addressTo: '', amount: '', keyword: '', message: '' })
    const [isLoading, setIsLoading] = useState(false)
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'))
    const [transactions, setTransactions] = useState([])

    const handleChange = (e, name) => {
        setFormData((prevState) => ({ ...prevState, [name]: e.target.value }))
    }

    const getAllTransactions = async() => {
        try {
            if(!ethereum) return alert('Please install metamask')
            const transactionContract = getEthereumContract()

            const availableTransactions = await transactionContract.getAllTransactions()

            const structuredTransactions = availableTransactions.map(({ receiver, sender, timestamp, message, keyword, amount }) => ({
                timestamp: new Date(timestamp.toNumber() * 1000).toLocaleString(),
                amount: parseInt(amount._hex) / (10 ** 18),
                addressTo: receiver,
                addressFrom: sender,
                message,
                keyword,
                
            }))

            console.log(structuredTransactions)

            setTransactions(structuredTransactions)
        } catch (error) {
         console.log(error)   
        }
    }

    const checkIfWalletIsConnected = async() => {
        try {
            if(!ethereum) return alert('Please install metamask')
        
            const accounts = await ethereum.request({ method: 'eth_accounts' })
            // console.log('accounts--->', accounts)
            if(accounts.length) {
                setCurrentAccount(accounts[0])
        
                getAllTransactions()
            } else {
                console.log('No accounts found')
            }
        } catch (error) {
            console.log(error)

            throw new Error('No ethereum object.')
        }
    }

    const checkIfTransactionExist = async() => {
        try {
            const transactionContract = getEthereumContract()
            const transactionCount = await transactionContract.getTransactionCount()

            window.localStorage.setItem('transactionCount', transactionCount)
        } catch (error) {
            console.log(error)

            throw new Error('No ethereum object.')
        }
    }

    const connectWallet = async() => {
        try {
            if(!ethereum) return alert('Please install metamask')

            const accounts = await ethereum.request({ method: 'eth_requestAccounts' })

            setCurrentAccount(accounts[0])
        } catch (error) {
            console.log(error)

            throw new Error('No ethereum object.')
        }
    }

    const sendTransaction = async() => {
        try {
            if(!ethereum) return alert('Please install metamask')

            // get the data from the form...
            const { addressTo, amount, keyword, message } = formData

            const transactionContract = getEthereumContract()

            const parsedAmount = ethers.utils.parseEther(amount)
            
            await ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: currentAccount,
                    to: addressTo,
                    gas: '0x5208', // (pass value is Hexadecimal) 1.hex to decimal get (21000 GWEI) then 2.convert 21000 GWEI to Ether https://www.rapidtables.com/convert/number/hex-to-decimal.html, https://eth-converter.com/
                    value: parsedAmount._hex, // (pass value is Hexadecimal)
                }]
            })
            
            const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword)

            setIsLoading(true)
            console.log(`Loading - ${transactionHash.hash}`)
            await transactionHash.wait()
            setIsLoading(false)
            console.log(`Success - ${transactionHash.hash}`)

            const transactionCount = await transactionContract.getTransactionCount()

            setTransactionCount(transactionCount.toNumber())

            window.location.reload()
        } catch (error) {
            console.log(error)

            throw new Error('No ethereum object.')
        }
    }

    useEffect(() => {
        checkIfWalletIsConnected()
        checkIfTransactionExist()
    }, [])

    return (
        <TransactionContext.Provider value={{ connectWallet, currentAccount, formData, setFormData, handleChange, sendTransaction, transactions, isLoading }}>
            {children}
        </TransactionContext.Provider>
    )
}