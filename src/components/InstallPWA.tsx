import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Image,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Export, PlusCircle, PlusSquare } from '@phosphor-icons/react'

import { isAndroid, isIOS } from 'react-device-detect'
import { eventName } from 'config/index'
import { useLocalStorage } from 'usehooks-ts'

declare global {
  interface Window {
    deferredPrompt: any
  }
}

const InstallPWA: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { t } = useTranslation()
  const [showPopup, setShowPopup] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(false)
  const [showInstallPWA] = useLocalStorage('showInstallPWA', false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      window.deferredPrompt = e
      setInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    if ((isAndroid || isIOS) && showInstallPWA === true) {
      setShowPopup(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [showInstallPWA])

  useEffect(() => {
    if (window.deferredPrompt) {
      setInstallPrompt(true)
    }
  }, [])

  const handleInstallClick = () => {
    // Logic to trigger the PWA installation prompt
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt()
      window.deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          handleCloseClick()
        }
        window.deferredPrompt = null
      })
    }
  }

  const handleCloseClick = () => {
    setShowPopup(false)
    if (onClose) {
      onClose()
    }
  }

  return (
    <Modal isOpen={showPopup} onClose={handleCloseClick} isCentered>
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent
        background="linear-gradient(180deg, #FBF5EE 28%, #FBE6D5 100%)"
        borderRadius="16px"
      >
        <ModalHeader fontSize="18px">{t('Install this app for a better experience.')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody mb={4}>
          <Box
            w="100%"
            display="flex"
            alignItems="start"
            justifyContent="start"
            bg="linear-gradient(180deg, #667E8C 0%, #59647C 100%)"
            borderRadius="16px"
            mb={4}
            pb={4}
          >
            <Box
              w="74px"
              display="flex"
              alignItems="start"
              justifyContent="start"
              flexDirection="column"
              my={4}
              ml={2}
            >
              <Box w="100%" display="flex" alignItems="center" justifyContent="center" px={2}>
                <Image src="/app-icon.png" alt={t('App icon')} borderRadius="16px" />
              </Box>
              <Text fontSize="11px" fontWeight="bold" mt={2} color="white">
                {eventName}
              </Text>
            </Box>
          </Box>
          <Box>
            {installPrompt ? (
              <Box display="flex" alignItems="center" gap={2}>
                <Box>
                  <Button onClick={handleInstallClick} leftIcon={<PlusCircle size={22} />}>
                    {t('Install')}
                  </Button>
                </Box>
                <Text>👈 {t('Click & accept the prompt!')}</Text>
              </Box>
            ) : isIOS ? (
              <Box display="content" alignItems="center">
                {t('iOS Instructions: Open this website in ')}
                <b>Safari</b>
                {t(', press ')}
                <Box as="span" display="inline-flex" style={{ position: 'relative', top: '4px' }}>
                  <Export size={22} />
                </Box>
                {t(', then "Add to home screen" ')}
                <Box as="span" display="inline-flex" style={{ position: 'relative', top: '4px' }}>
                  <PlusSquare size={22} />
                </Box>
              </Box>
            ) : (
              <Text display="content" alignItems="center">
                {t('Instructions: press ')}
                <Box as="span" display="inline-flex" style={{ position: 'relative', top: '4px' }}>
                  <Export size={22} />
                </Box>
                {t(', then "Add to home screen"')}
              </Text>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default InstallPWA
