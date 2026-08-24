import { MapPin } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getDefaultAddress } from "../../services/address.api";
import type { Address } from "../../type/address";
import AddressSelectorModal from "../address/addressSelectorModal";

type Props = {
  onAddressChange?: (address?: Address) => void;
};

export default function CheckoutAddress({ onAddressChange }: Props) {
  const [address, setAddress] = useState<Address>();
  const [openAddressModal, setOpenAddressModal] = useState(false);

  const fetchDefaultAddress = useCallback(async () => {
    try {
      const address = await getDefaultAddress();
      setAddress(address);
      onAddressChange?.(address);
    } catch (error) {
      console.error(error);
      onAddressChange?.(undefined);
    }
  }, [onAddressChange]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void fetchDefaultAddress();
    });

    return () => {
      cancelled = true;
    };
  }, [fetchDefaultAddress]);

  return (
    <div className="checkout-card">
      <div className="section-title">
        <MapPin size={18} />
        Địa chỉ nhận hàng
      </div>

      <div className="address-box">
        <div className="address-header">
          <strong>
            {address?.recipientName} | {address?.phone}
          </strong>

          <button onClick={() => setOpenAddressModal(true)}>Thay đổi</button>
        </div>

        <p>{address?.addressLine}</p>
      </div>
      <AddressSelectorModal
        open={openAddressModal}
        onClose={() => setOpenAddressModal(false)}
        onSuccess={fetchDefaultAddress}
      />
    </div>
  );
}
