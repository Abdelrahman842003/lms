<?php

namespace App\Domains\Subscriptions\Gateways\ManualTransfer\Message;

use Omnipay\Common\Message\AbstractRequest;

class PurchaseRequest extends AbstractRequest
{
    public function getData()
    {
        $this->validate('amount', 'currency', 'paymentMethod');

        return [
            'amount' => $this->getAmount(),
            'currency' => $this->getCurrency(),
            'paymentMethod' => $this->getPaymentMethod(),
            'description' => $this->getDescription(),
        ];
    }

    public function getPaymentMethod()
    {
        return $this->getParameter('paymentMethod');
    }

    public function setPaymentMethod($value)
    {
        return $this->setParameter('paymentMethod', $value);
    }

    public function sendData($data)
    {
        return $this->response = new PurchaseResponse($this, $data);
    }
}
